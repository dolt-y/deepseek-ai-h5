# 项目重制说明 

- 2026-2-28项目迁移目标: 为了更好的统一前后端开发及vibingcoding协作方式，将项目重制为monorepo模式。

## 一、项目定位
一个 H5/小程序通用的 AI 对话系统，包含：
- 前端：Vue 3 + Vite 的 H5 聊天界面
- 后端：Express + SQLite 的 AI 服务接口

## 二、当前仓库结构
- `wechat-ai-fontend/`：H5 前端（Vite + Vue 3）
- `wechat-ai-backend/`：Node.js 后端（Express + SQLite）
- `packages/shared/`：前后端共享常量与类型（例如 API 路由）
- `vibing-coding/`：迭代需求与发布文档规范
- `AGENTS.md`：协作与运行说明

## 三、运行方式（Monorepo）
根目录一次性安装依赖：
```bash
pnpm install
```

启动前后端：
```bash
pnpm run dev:all
```

单独启动：
```bash
pnpm run dev:frontend
pnpm run dev:backend
```

生成前端 OpenAPI 类型与 client：
```bash
pnpm run gen:openapi
```

## 四、环境变量
后端（`wechat-ai-backend/.env`）：
- `JWT_SECRET`
- `DB_FILE`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `WX_APP_ID` / `WX_APP_SECRET`（可选）
- `WHISPER_ROOT` / `WHISPER_SAMPLE_PATH`（可选）
- `PORT`

前端（`wechat-ai-fontend/.env.development` 或 `.env.local`）：
- `VITE_OPENAI_BASE_URL=http://localhost:3000`

## 五、主要能力（现状对齐）
- JWT 登录与鉴权（支持 H5 账号登录）
- 对话接口（SSE 流式回复）
- 会话列表与历史记录
- 消息点赞与重新生成
- OCR 图片识别（tesseract.js）
- 语音识别（whisper.cpp）
- Swagger API 文档（`/docs`）

## 六、已知限制
- 未配置自动化测试与 CI。
- 前后端仍需各自维护环境配置与启动方式。

## 七、文档入口
- 后端详细对齐说明：`wechat-ai-backend/REMADE.md`
- 后端技术文档：`wechat-ai-backend/TECHNICAL_DOC.md`
- 前端说明：`wechat-ai-fontend/README.md`
- 迭代规范：`vibing-coding/README.md`
