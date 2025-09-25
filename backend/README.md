# Backend - Simple Issue Tracker (FastAPI)

## Requirements
- Python 3.9+
- pip

## Install
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Linux/macOS
venv\Scripts\activate         # Windows
pip install -r requirements.txt
```

## Run
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API endpoints:
- `GET /health` -> `{ "status": "ok" }`
- `GET /issues` -> list issues. Supports query params: `search`, `status`, `priority`, `assignee`, `sortBy`, `sortDir`, `page`, `pageSize`
- `GET /issues/{id}` -> get single issue
- `POST /issues` -> create issue (body: title, description, status, priority, assignee)
- `PUT /issues/{id}` -> update issue (partial fields)

Data is stored in `data/issues.json` (simple JSON storage).
