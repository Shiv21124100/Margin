# Margin Requirement Calculator (Frontend + Backend)

Assignment 1 — Initial margin preview flow with a Go backend and a React frontend.

## Overview
- Backend (Go) exposes:
  - `GET /config/assets` for asset metadata
  - `POST /margin/validate` to validate submitted margin
- Frontend (React + Vite) provides a clean UI:
  - Fetches config on load
  - Calculates margin live as inputs change
  - Sends preview to backend and displays success/error

## Margin Formula
```
margin_required = (mark_price * order_size * contract_value) / leverage
```
Rounded to two decimals.

## Backend
- Location: `/backend`
- Entry: [main.go](file:///c:/Users/Dell/Documents/trae_projects/Calculator/backend/main.go)
- Module: [go.mod](file:///c:/Users/Dell/Documents/trae_projects/Calculator/backend/go.mod)
  
Alternate Node.js backend:
- Entry: [server.js](file:///c:/Users/Dell/Documents/trae_projects/Calculator/backend/server.js)
- Package: [package.json](file:///c:/Users/Dell/Documents/trae_projects/Calculator/backend/package.json)

### Endpoints
- `GET /config/assets`
  - Response:
    ```json
    {
      "assets": [
        {
          "symbol": "BTC",
          "mark_price": 62000,
          "contract_value": 0.001,
          "allowed_leverage": [5, 10, 20, 50, 100]
        },
        {
          "symbol": "ETH",
          "mark_price": 3200,
          "contract_value": 0.01,
          "allowed_leverage": [5, 10, 25, 50]
        }
      ]
    }
    ```
- `POST /margin/validate`
  - Request:
    ```json
    {
      "asset": "BTC",
      "order_size": 2,
      "side": "long",
      "leverage": 20,
      "margin_client": 6.2
    }
    ```
  - Success:
    ```json
    {
      "status": "ok",
      "margin_required": 6.2
    }
    ```
  - Failure:
    ```json
    {
      "status": "error",
      "message": "Insufficient margin submitted",
      "margin_required": 5
    }
    ```

### Run Backend Locally
Option A — Go:
1. Install Go (1.21+).
2. From `/backend`:
   ```
   go run .
   ```
3. Server listens on `http://localhost:8080`.

Option B — Node.js:
1. Node.js 18+.
2. From `/backend`:
   ```
   npm install
   npm start
   ```
3. Server listens on `http://localhost:8080`.

## Frontend
- Location: `/frontend`
- Entry HTML: [index.html](file:///c:/Users/Dell/Documents/trae_projects/Calculator/frontend/index.html)
- App: [App.tsx](file:///c:/Users/Dell/Documents/trae_projects/Calculator/frontend/src/App.tsx), [main.tsx](file:///c:/Users/Dell/Documents/trae_projects/Calculator/frontend/src/main.tsx)
- Styles: [style.css](file:///c:/Users/Dell/Documents/trae_projects/Calculator/frontend/src/style.css)

### Run Frontend Locally
1. Node.js 18+ (tested with Node 22).
2. From `/frontend`:
   ```
   npm install
   npm run dev
   ```
3. Open `http://localhost:5173`.
4. To point the frontend at a different backend URL, create `/frontend/.env`:
   ```
   VITE_BACKEND_URL=http://localhost:8080
   ```
   Or replace with your deployed backend URL.

## Assumptions
- Asset metadata is static, and mark prices are served by the backend.
- Allowed leverage values are enforced by backend validation.
- Business validation failures return HTTP 400 with a JSON body.
- Frontend displays a fallback set of assets if the backend is unreachable, to allow UI interaction. When the backend is running, live data is used.

## Deployed Product
- You can deploy backend to a Go-compatible host (Render/Fly.io) and frontend to any static host (Vercel/Netlify).
- Update `BACKEND_URL` in the frontend if deploying to a remote backend.

## Steps To Run Locally
1. Start backend:
   - `cd backend && go run .`
2. Start frontend:
   - `cd frontend && npm install && npm run dev`
3. Navigate to frontend URL and interact with the app.

## Code References
- Backend: [main.go](file:///c:/Users/Dell/Documents/trae_projects/Calculator/backend/main.go)
- Frontend App: [App.tsx](file:///c:/Users/Dell/Documents/trae_projects/Calculator/frontend/src/App.tsx)
