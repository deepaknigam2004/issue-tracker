from fastapi import FastAPI, HTTPException, Query, Path
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime
import os, json, threading

DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "issues.json")
os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
_lock = threading.Lock()

def _now_iso():
    return datetime.utcnow().isoformat() + "Z"

def _load_data():
    if not os.path.exists(DATA_FILE):
        return {"last_id": 0, "issues": []}
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def _save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

class IssueBase(BaseModel):
    title: str = Field(..., example="Bug: cannot save")
    description: Optional[str] = Field(None, example="Steps to reproduce...")
    status: Literal["open", "in-progress", "closed"] = Field("open")
    priority: Literal["low", "medium", "high"] = Field("medium")
    assignee: Optional[str] = None

class IssueCreate(IssueBase):
    pass

class IssueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[Literal["open", "in-progress", "closed"]] = None
    priority: Optional[Literal["low", "medium", "high"]] = None
    assignee: Optional[str] = None

class Issue(IssueBase):
    id: int
    createdAt: str
    updatedAt: str

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Simple Issue Tracker API")

# Allow CORS for local frontend during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/issues", response_model=dict)
def list_issues(
    search: Optional[str] = Query(None, description="search in title, case-insensitive"),
    status: Optional[str] = Query(None, description="filter by status"),
    priority: Optional[str] = Query(None, description="filter by priority"),
    assignee: Optional[str] = Query(None, description="filter by assignee"),
    sortBy: Optional[str] = Query("updatedAt", description="field to sort by"),
    sortDir: Optional[str] = Query("desc", description="'asc' or 'desc'"),
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
):
    data = _load_data()
    issues = data.get("issues", []).copy()

    # Filters
    if search:
        s = search.lower()
        issues = [i for i in issues if s in i.get("title","").lower()]
    if status:
        issues = [i for i in issues if i.get("status")==status]
    if priority:
        issues = [i for i in issues if i.get("priority")==priority]
    if assignee:
        issues = [i for i in issues if i.get("assignee")==assignee]

    # Sorting
    reverse = (sortDir == "desc")
    try:
        issues.sort(key=lambda x: x.get(sortBy) or "", reverse=reverse)
    except Exception:
        pass

    total = len(issues)
    # Pagination
    start = (page - 1) * pageSize
    end = start + pageSize
    page_items = issues[start:end]

    return {"total": total, "page": page, "pageSize": pageSize, "issues": page_items}

@app.get("/issues/{issue_id}", response_model=Issue)
def get_issue(issue_id: int = Path(..., ge=1)):
    data = _load_data()
    for i in data.get("issues", []):
        if i.get("id") == issue_id:
            return i
    raise HTTPException(status_code=404, detail="Issue not found")

@app.post("/issues", response_model=Issue, status_code=201)
def create_issue(issue: IssueCreate):
    with _lock:
        data = _load_data()
        last_id = data.get("last_id", 0) + 1
        now = _now_iso()
        new = issue.dict()
        new.update({"id": last_id, "createdAt": now, "updatedAt": now})
        data.setdefault("issues", []).insert(0, new)  # add newest first
        data["last_id"] = last_id
        _save_data(data)
        return new

@app.put("/issues/{issue_id}", response_model=Issue)
def update_issue(issue_id: int, upd: IssueUpdate):
    with _lock:
        data = _load_data()
        for idx, i in enumerate(data.get("issues", [])):
            if i.get("id") == issue_id:
                changed = False
                updict = upd.dict(exclude_unset=True)
                for k, v in updict.items():
                    if k in i and v is not None:
                        i[k] = v
                        changed = True
                if changed:
                    i["updatedAt"] = _now_iso()
                    data["issues"][idx] = i
                    _save_data(data)
                return i
        raise HTTPException(status_code=404, detail="Issue not found")
