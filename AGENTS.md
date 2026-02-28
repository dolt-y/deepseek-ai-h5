# AGENTS

Project: H5 AI chat app with a Vue 3 frontend and an Express + SQLite backend.

Repository layout
- `wechat-ai-fontend`: Vite + Vue 3 H5 client
- `wechat-ai-backend`: Node.js + Express API server

Quick commands
Workspace (run at repo root)
- `pnpm install`
- `pnpm run dev:frontend`
- `pnpm run dev:backend`
- `pnpm run build:frontend`
- `pnpm run preview:frontend`
- `pnpm run gen:openapi`

Frontend (run in `wechat-ai-fontend`)
- `pnpm -C wechat-ai-fontend install`
- `pnpm -C wechat-ai-fontend dev` (dev server)
- `pnpm -C wechat-ai-fontend build` (production build)
- `pnpm -C wechat-ai-fontend preview` (preview build)

Backend (run in `wechat-ai-backend`)
- `pnpm -C wechat-ai-backend install`
- `pnpm -C wechat-ai-backend dev` (nodemon)
- `node index.js` (prod)

Environment configuration
Backend `.env` (required)
- `WX_APP_ID=...`
- `WX_APP_SECRET=...`
- `JWT_SECRET=...`
- `PORT=3000`
- `DB_FILE=wechat-mini.db` (or absolute path)
- `OPENAI_API_KEY=...`
- `OPENAI_BASE_URL=...`

Frontend Vite env (create `.env.development` or `.env.local`)
- `VITE_OPENAI_BASE_URL=http://localhost:3000`

Key files and ownership
Frontend
- `wechat-ai-fontend/src/utils/api.ts`: API paths + base URL
- `wechat-ai-fontend/src/hook/*`: auth, streaming, scroll, recording logic
- `wechat-ai-fontend/src/components/*`: chat UI components
- `wechat-ai-fontend/src/style.scss`: global theme styles

Backend
- `wechat-ai-backend/index.js`: server bootstrap, route mounting
- `wechat-ai-backend/routes/ai.js`: AI/chat routes
- `wechat-ai-backend/routes/user.js`: auth/user routes
- `wechat-ai-backend/controllers/*`: route handlers
- `wechat-ai-backend/db.js`: SQLite schema + helpers
- `wechat-ai-backend/swagger.js`: OpenAPI spec
- `wechat-ai-backend/wechat-mini.db`: local SQLite database

API surface (backend)
- `POST /api/user/login`
- `POST /api/user/login/h5`
- `GET /api/user/info`
- `POST /api/user/refresh`
- `POST /api/ai/chat` (SSE stream, JWT required)
- `POST /api/ai/chat-mock`
- `GET /api/ai/sessions`
- `GET /api/ai/sessions/:id/messages`
- `POST /api/ai/sessions/:id/delete`
- `POST /api/ai/messages/:id/like`
- `POST /api/ai/messages/:id/regenerate`
- `POST /api/ai/speech-to-text`
- `GET /docs` and `GET /docs.json`

Conventions
- Frontend reads base URL from `import.meta.env.VITE_OPENAI_BASE_URL`.
- `/api/ai/*` routes require `Authorization: Bearer <token>`.
- Chat responses stream via SSE.

Generated or large artifacts (avoid editing unless required)
- `wechat-ai-fontend/dist`
- `wechat-ai-fontend/build`
- `**/node_modules`
- `wechat-ai-backend/temp`
- `wechat-ai-backend/whisper.cpp`

Tests
- No automated tests configured.
