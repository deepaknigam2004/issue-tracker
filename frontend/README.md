# Frontend - Simple Issue Tracker (TypeScript)

This is a lightweight TypeScript + plain HTML frontend (no framework) that talks to the backend API.

## Run (simplest)
1. Make sure the backend API is running on http://localhost:8000
2. Serve the `frontend/src` folder using a static server. E.g.:
   ```bash
   cd frontend/src
   python -m http.server 5173
   ```
3. Open http://localhost:5173 in your browser.

## Developer (TypeScript)
The file `src/app.ts` contains the TypeScript source. A compiled `app.js` is included for runtime.
If you want to recompile TypeScript, install `typescript` and run `tsc` in the frontend/src directory (you may need a tsconfig.json).
