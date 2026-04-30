# AGENTS

Project: H5 AI chat app with a Vue 3 frontend and an Express + SQLite backend.

Repository layout
- `ui`: Vite + Vue 3 H5 client
- `backend`: Node.js + Express API server

Quick commands
Workspace (run at repo root)
- `npm install`
- `npm run dev:frontend`
- `npm run dev:backend`
- `npm run build:frontend`
- `npm run preview:frontend`
- `npm --prefix backend run worker:all`

Frontend (run in `ui`)
- `npm install`
- `npm run dev` (dev server)
- `npm run build` (production build)
- `npm run preview` (preview build)

Backend (run in `backend`)
- `npm install`
- `npm run dev` (nodemon)
- `node index.js` (prod)
- `npm run worker:all` (BullMQ workers)

Environment configuration
Backend `.env` (required)
- `WX_APP_ID=...`
- `WX_APP_SECRET=...`
- `JWT_SECRET=...`
- `PORT=3000`
- `DB_FILE=wechat-mini.db` (or absolute path)
- `OPENAI_API_KEY=...`
- `OPENAI_BASE_URL=...`
- `REDIS_URL=redis://127.0.0.1:6379`

Frontend Vite env (create `.env.development` or `.env.local`)
- `VITE_OPENAI_BASE_URL=http://localhost:3000`

Key files and ownership
Frontend
- `ui/src/utils/api.ts`: API paths + base URL
- `ui/src/hook/*`: auth, streaming, scroll, recording logic
- `ui/src/components/*`: chat UI components
- `ui/src/style.scss`: global theme styles

Backend
- `backend/index.js`: server bootstrap, route mounting
- `backend/routes/ai.js`: AI/chat routes
- `backend/routes/user.js`: auth/user routes
- `backend/controllers/*`: route handlers
- `backend/db.js`: SQLite schema + helpers
- `backend/swagger.js`: OpenAPI spec
- `backend/wechat-mini.db`: local SQLite database

API surface (backend)
- `POST /api/user/login`
- `POST /api/user/login/h5`
- `GET /api/user/info`
- `POST /api/user/refresh`
- `POST /api/ai/chat` (SSE stream, JWT required)
- `GET /api/ai/sessions`
- `GET /api/ai/sessions/:id/messages`
- `POST /api/ai/sessions/:id/delete`
- `POST /api/ai/messages/:id/like`
- `POST /api/ai/messages/:id/regenerate`
- `POST /api/ai/speech-to-text/jobs`
- `GET /api/ai/speech-to-text/jobs/:id`
- `GET /docs` and `GET /docs.json`

Conventions
- Frontend reads base URL from `import.meta.env.VITE_OPENAI_BASE_URL`.
- `/api/ai/*` routes require `Authorization: Bearer <token>`.
- Chat responses stream via SSE.

Generated or large artifacts (avoid editing unless required)
- `ui/dist`
- `ui/build`
- `**/node_modules`
- `backend/temp`
- `backend/whisper.cpp`

Tests
- No automated tests configured.
