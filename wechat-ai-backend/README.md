# AI 后端文档

## 1. 项目定位
- 面向 H5 / 小程序的 AI 对话后端服务
- 提供用户鉴权、会话管理、消息存储、SSE 流式回复
- 支持多模态输入：文本、图片（OCR）、语音（whisper.cpp 本地 ASR）

## 2. 技术栈
- Node.js (ESM)
- Express 5
- SQLite3
- JWT
- OpenAI SDK（兼容自定义 Base URL）
- tesseract.js（OCR）
- whisper.cpp（本地语音转文本）
- Swagger（`/docs`、`/docs.json`）

## 3. 快速启动
在 `wechat-ai-backend` 目录执行：

```bash
npm install
npm run dev
```

生产启动：

```bash
node index.js
```

默认监听地址：`http://localhost:3000`（端口可由 `PORT` 覆盖）。

## 4. 环境变量
后端 `.env`：

必需：
- `JWT_SECRET`
- `DB_FILE`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`

可选：
- `WX_APP_ID`
- `WX_APP_SECRET`
- `PORT`（默认 `3000`）
- `WHISPER_ROOT`（默认 `./whisper.cpp`）
- `WHISPER_SAMPLE_PATH`（默认 `./sample-6s.wav`）

## 5. 目录结构（当前实现）
```text
wechat-ai-backend/
├── index.js                  # 服务入口
├── config.js                 # 环境配置读取
├── db.js                     # SQLite 初始化与连接
├── routes/                   # 路由层
├── controllers/              # 控制器层（入参/响应）
├── services/                 # 业务层（聊天/OCR/ASR）
├── repositories/             # 数据访问层（SQL）
├── middleware/               # 鉴权/上传/whisper 适配
├── docs/swagger/             # OpenAPI 定义
├── swagger.js                # Swagger 聚合入口
├── whisper.cpp/              # 本地 ASR 目录（可选）
└── temp/                     # 上传文件临时目录
```

## 6. API 概览
文档入口：
- `GET /docs`
- `GET /docs.json`

用户：
- `POST /api/user/login`
- `POST /api/user/login/h5`
- `GET /api/user/info`（JWT）
- `POST /api/user/refresh`（JWT）

AI 与会话（均需 JWT）：
- `POST /api/ai/chat`（SSE，支持图片输入）
- `POST /api/ai/chat-mock`
- `GET /api/ai/models`
- `GET /api/ai/sessions`
- `GET /api/ai/sessions/:id/messages`
- `POST /api/ai/sessions/:id/delete`
- `POST /api/ai/messages/:id/like`
- `POST /api/ai/messages/:id/regenerate`
- `POST /api/ai/speech-to-text`（语音转文本）

鉴权约定：
- 除登录接口外，统一使用 `Authorization: Bearer <token>`

## 7. 核心流程
登录：
1. 小程序登录：`/api/user/login`（`code` + `userInfo`）
2. H5 登录：`/api/user/login/h5`（账号密码，不存在自动注册）
3. 返回 JWT，后续请求携带 token

对话（SSE）：
1. 写入用户消息并创建/更新会话
2. 调用模型流式输出
3. 通过 `text/event-stream` 返回片段
4. 流结束后持久化助手回复

图片：
1. 前端通过 `/api/ai/chat` 以 multipart 上传图片
2. 后端将图片保存到 `uploads/chat-images/` 并写入 `chat_records.media`
3. OCR 识别文本（可拼接用户 prompt）后作为用户内容发送给模型

语音：
1. 前端上传音频到 `/api/ai/speech-to-text`
2. 后端写入 `temp/` 并调用 `whisper-cli`
3. 返回转写文本，前端再将文本发到对话接口

## 8. 数据库结构（SQLite）
`users`
- `openid`（主键）
- `username`
- `passwordHash`
- `nickname`
- `avatarUrl`
- `model`
- `lastLogin`

`sessions`
- `id`（自增主键）
- `openid`
- `title`
- `created_at`
- `updated_at`

`chat_records`
- `id`（自增主键）
- `session_id`
- `role`
- `content`
- `type`（`text`/`image`/`audio`）
- `media`
- `reasoning_content`
- `created_at`
- `liked`

## 9. whisper.cpp 编译与模型准备
在 `wechat-ai-backend` 目录执行：

```bash
git clone https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp
bash ./models/download-ggml-model.sh tiny
mkdir build
cd build
cmake ..
make -j4
```

默认要求：
- 可执行文件：`whisper.cpp/build/bin/whisper-cli`
- 模型文件：`whisper.cpp/models/ggml-tiny.bin`

若路径不同，请设置 `WHISPER_ROOT`。

## 10. 开发约束与现状
- 路由层只做路由挂载，不写重业务逻辑
- 业务编排放在 `services/`
- SQL 统一在 `repositories/`
- 当前未配置自动化测试和 CI
