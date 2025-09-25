# Simple Issue Tracker - Full Project

This project contains:
- `backend/` - FastAPI backend
- `frontend/src/` - TypeScript + HTML frontend

## Quick start (recommended)
1. Start backend:
   ```bash
   cd backend
   python -m venv venv
   # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
2. Serve frontend (simple static server):
   ```bash
   cd frontend/src
   python -m http.server 5173
   # open http://localhost:5173 in your browser
   ```

## Notes
- The backend stores data in `backend/data/issues.json`. It's a simple JSON store (no DB).
- The frontend expects the backend at `http://localhost:8000`. If you run backend on a different origin/port, update `frontend/src/app.js` and `app.ts` API_BASE constant.

