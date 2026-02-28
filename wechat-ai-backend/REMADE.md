# 项目概要与重制说明（现状对齐）

本文件用于描述**当前仓库实际实现**的能力与结构，替代早期的需求草案。

## 一、项目定位
- 面向 H5 / 小程序的 AI 对话后端服务
- 支持文本、图片（OCR）、语音（ASR）的输入形式
- 提供会话管理、消息记录、流式响应与基础鉴权

## 二、核心功能（已实现）
1. 用户登录与鉴权  
   - 微信登录：`POST /api/user/login`  
   - H5 账号登录：`POST /api/user/login/h5`（不存在自动注册）  
   - JWT 鉴权与刷新：`POST /api/user/refresh`
2. AI 对话（支持 SSE 流式）  
   - `POST /api/ai/chat`（stream=true 以 SSE 输出）  
   - `POST /api/ai/chat-mock`（调试用 mock 流）
3. 会话管理  
   - 创建与列表：`GET /api/ai/sessions`  
   - 获取会话消息：`GET /api/ai/sessions/:id/messages`  
   - 删除会话：`POST /api/ai/sessions/:id/delete`
4. 消息能力  
   - 点赞：`POST /api/ai/messages/:id/like`  
   - 重新生成：`POST /api/ai/messages/:id/regenerate`
5. OCR 图片识别  
   - 通过 `tesseract.js` 识别图片消息  
   - 支持 `imageUrl` / `imageBase64` / multipart 上传
6. 语音识别（ASR）  
   - `POST /api/ai/speech-to-text`  
   - 基于 `whisper.cpp` 本地模型转写
7. API 文档  
   - `GET /docs` / `GET /docs.json`

## 三、端到端流程（简要）
1. 登录 -> 获取 JWT  
2. 发起对话 -> 自动创建会话  
3. 记录用户消息 -> 调用模型 -> SSE 推送回复  
4. 持久化助手回复 -> 会话可回看  

图片消息流程：
- 识别图片内容（OCR） -> 组装为文本 -> 进入对话流程

语音消息流程：
- 调用 `speech-to-text` -> 文本结果 -> 由前端再发送到对话接口

## 四、当前模块与目录
- `index.js`：服务入口、路由挂载  
- `routes/*`：API 路由  
- `controllers/*`：控制器  
- `services/*`：业务逻辑（chat、OCR、ASR）  
- `repositories/*`：SQLite 数据访问  
- `middleware/*`：鉴权、上传、Whisper 适配  
- `utils/*`：SSE、错误处理等工具  
- `docs/swagger/*`：Swagger 定义  
- `db.js`：数据库初始化与连接

## 五、技术栈（实际实现）
- Node.js + Express 5
- SQLite3（本地文件数据库）
- JWT（鉴权）
- OpenAI SDK（模型调用，支持自定义 Base URL）
- Tesseract.js（OCR）
- whisper.cpp（本地 ASR）
- Multer（文件上传内存存储）
- Swagger（API 文档）

## 六、接口概要（实际路由）
用户
- `POST /api/user/login`
- `POST /api/user/login/h5`
- `GET /api/user/info`
- `POST /api/user/refresh`

AI / 会话
- `POST /api/ai/chat`（SSE）
- `POST /api/ai/chat-mock`
- `GET /api/ai/sessions`
- `GET /api/ai/sessions/:id/messages`
- `POST /api/ai/sessions/:id/delete`
- `GET /api/ai/models`
- `POST /api/ai/messages/:id/like`
- `POST /api/ai/messages/:id/regenerate`
- `POST /api/ai/speech-to-text`

## 七、数据结构（SQLite）
users
- `openid`（主键）
- `username` / `passwordHash`
- `nickname` / `avatarUrl`
- `model`（默认模型）
- `lastLogin`

sessions
- `id`（自增）
- `openid`（用户关联）
- `title`
- `created_at` / `updated_at`

chat_records
- `id`（自增）
- `session_id`（会话关联）
- `role`（user/assistant）
- `content`
- `type`（text/image/audio）
- `media`（图片/音频 URL 或 dataURL）
- `reasoning_content`（思考链，可选）
- `created_at`
- `liked`

## 八、配置与环境变量
必需
- `JWT_SECRET`
- `DB_FILE`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`

可选
- `WX_APP_ID` / `WX_APP_SECRET`
- `WHISPER_ROOT`（whisper.cpp 路径）
- `WHISPER_SAMPLE_PATH`（默认转写音频）
- `PORT`

## 九、已知限制与待完善
- `speech-to-text` 当前使用本地 sample 路径转写，上传文件尚未直接接入（需补齐）。
- OCR 与 ASR 都为本地计算，部署时需评估资源与性能。
- 未配置自动化测试与 CI。

