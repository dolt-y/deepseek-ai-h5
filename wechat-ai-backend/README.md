# wechat-ai-backend 后端说明

`wechat-ai-backend` 是本仓库的 API 服务端，基于 Express + SQLite 实现，负责用户鉴权、会话持久化、AI 流式回复、图片上传、语音转写和 Swagger 文档输出。

## 项目定位

- 为 H5 / 小程序 AI 聊天端提供统一后端服务
- 提供 JWT 登录态、会话与消息存储
- 对接兼容 OpenAI SDK 的模型服务
- 通过 SSE 向前端持续推送聊天增量内容
- 通过 `whisper.cpp` 提供本地语音转文字能力

## 技术栈

- Node.js ESM
- Express 5
- SQLite3
- JWT
- OpenAI Node SDK
- Multer
- Swagger
- `whisper.cpp`

## 目录结构

```text
wechat-ai-backend/
├── clients/
│   └── openaiClient.js          # OpenAI / DeepSeek 客户端封装
├── controllers/                # 控制器层，负责请求入参与响应
├── docs/swagger/               # Swagger 注释定义
├── errors/                     # 业务错误类型
├── middleware/
│   ├── auth.js                 # JWT 鉴权
│   ├── upload.js               # 图片/音频上传处理
│   └── whisper.js              # whisper.cpp CLI 封装
├── repositories/              # SQLite 数据访问层
├── routes/                    # 路由定义
├── services/                  # 业务编排层
├── temp/                      # 语音识别临时文件目录
├── uploads/                   # 图片上传目录
├── config.js                  # 环境变量加载
├── db.js                      # SQLite 初始化与建表
├── index.js                   # 服务入口
├── swagger.js                 # Swagger 规范聚合
└── wechat-mini.db             # 本地数据库文件
```

## 运行要求

- Node.js `>= 20.18.0`
- npm `>= 10`
- 已准备可用的 OpenAI 兼容模型服务
- 若启用语音转写，需要可执行的 `whisper.cpp`

## 环境变量

### 加载规则

服务启动时按以下顺序读取配置：

1. 先加载 `.env`
2. 再按 `NODE_ENV` 加载 `.env.${NODE_ENV}`，并覆盖同名配置

例如：

- `NODE_ENV=development` 时会读取 `.env.development`
- `NODE_ENV=production` 时会读取 `.env.production`

### 必填项

| 变量名 | 说明 |
| --- | --- |
| `JWT_SECRET` | JWT 签名密钥 |
| `DB_FILE` | SQLite 文件路径，支持相对路径或绝对路径 |
| `OPENAI_API_KEY` | 模型服务 API Key |
| `OPENAI_BASE_URL` | OpenAI 兼容服务地址，例如 DeepSeek/OpenRouter/自建网关 |

### 可选项

| 变量名 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3000` | 服务端口 |
| `HOST` | 开发环境 `0.0.0.0`，生产环境 `127.0.0.1` | 监听地址 |
| `CORS_ORIGIN` | `*`（仅开发环境生效） | 允许的跨域来源，多个用逗号分隔 |
| `WX_APP_ID` | - | 小程序登录所需 |
| `WX_APP_SECRET` | - | 小程序登录所需 |
| `SWAGGER_SERVER_URL` | `http://localhost:${PORT}` | Swagger 文档中的服务地址 |
| `WHISPER_ROOT` | `./whisper.cpp` | whisper.cpp 根目录 |
| `WHISPER_SAMPLE_PATH` | `./sample-6s.wav` | 默认测试音频路径 |

### 推荐 `.env` 示例

```bash
JWT_SECRET=replace-this-with-a-strong-secret
DB_FILE=./wechat-mini.db
OPENAI_API_KEY=sk-xxxx
OPENAI_BASE_URL=https://api.deepseek.com
PORT=3000
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:5173

# 仅小程序登录需要
WX_APP_ID=
WX_APP_SECRET=

# 仅语音识别需要
WHISPER_ROOT=./whisper.cpp
WHISPER_SAMPLE_PATH=./sample-6s.wav
```

## 快速开始

在仓库根目录启动：

```bash
npm install
npm run dev:backend
```

或者在后端目录单独启动：

```bash
cd wechat-ai-backend
npm install
npm run dev
```

生产启动：

```bash
cd wechat-ai-backend
npm run start
```

默认访问地址：

```text
http://localhost:3000
```

API 文档入口：

```text
http://localhost:3000/docs
http://localhost:3000/docs.json
```

## 接口总览

### 用户接口

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| `POST` | `/api/user/login` | 否 | 小程序登录 |
| `POST` | `/api/user/login/h5` | 否 | H5 账号密码登录，不存在则自动注册 |
| `GET` | `/api/user/info` | 是 | 获取当前用户信息 |
| `POST` | `/api/user/refresh` | 是 | 刷新 JWT |

### AI 与会话接口

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| `POST` | `/api/ai/chat` | 是 | 正式聊天接口，支持 JSON 和图片上传 |
| `POST` | `/api/ai/chat-mock` | 是 | Mock SSE，便于前端联调 |
| `GET` | `/api/ai/sessions` | 是 | 获取当前用户会话列表 |
| `GET` | `/api/ai/sessions/:id/messages` | 是 | 获取会话消息 |
| `POST` | `/api/ai/sessions/:id/delete` | 是 | 删除会话及其消息 |
| `GET` | `/api/ai/models` | 是 | 获取模型列表 |
| `POST` | `/api/ai/messages/:id/like` | 是 | 切换消息点赞状态 |
| `POST` | `/api/ai/messages/:id/regenerate` | 是 | 重新生成指定助手消息 |
| `POST` | `/api/ai/speech-to-text` | 是 | 音频转文字 |

鉴权约定：

- 除登录接口外，其余接口统一使用 `Authorization: Bearer <token>`

## 核心请求约定

### 1. 对话接口 `/api/ai/chat`

文本对话使用 JSON：

```json
{
  "messages": [
    {
      "role": "user",
      "type": "text",
      "content": "你好"
    }
  ],
  "sessionId": 1,
  "stream": true,
  "model": "deepseek-v4-flash"
}
```

图片提问使用 `multipart/form-data`：

- `messages`: JSON 字符串
- `image`: 图片文件
- `sessionId`: 可选
- `stream`: `true`
- `model`: 模型名，支持 `deepseek-v4-flash`、`deepseek-v4-pro`

### 2. SSE 事件格式

当 `stream=true` 时，服务端通过 `text/event-stream` 返回如下事件：

```json
{"type":"delta","text":"你好"}
{"type":"thinking","thinking":"正在分析问题"}
{"type":"done","sessionId":1}
```

说明：

- `delta` 表示回复正文增量
- `thinking` 表示推理内容增量
- `done` 表示流结束，并返回最终会话 ID

### 3. 语音转文字 `/api/ai/speech-to-text`

请求方式：

- `multipart/form-data`
- 文件字段名：`audio`
- 可选字段：`lang`，默认 `zh`

响应示例：

```json
{
  "msg": "语音识别成功",
  "text": "识别后的文本"
}
```

## 核心业务流程

### H5 登录

1. 客户端调用 `/api/user/login/h5`
2. 如果用户名不存在则自动注册
3. 返回 JWT
4. 后续请求由客户端携带 Bearer Token

### 对话与持久化

1. 若未传 `sessionId`，先创建新会话
2. 读取该会话已有历史消息
3. 将本次用户消息写入 `chat_records`
4. 调用模型服务获取回复
5. 流式模式下将增量内容通过 SSE 输出
6. 结束后将助手完整回复写回数据库

### 图片消息

1. 图片通过 Multer 落盘到 `uploads/chat-images/`
2. 用户消息以 `type=image` 持久化
3. 图片访问路径通过 `/uploads/...` 暴露

### 语音识别

1. 音频文件先写入 `temp/`
2. 通过 `whisper.cpp/build/bin/whisper-cli` 执行转写
3. 返回文本结果
4. 临时文件在转写结束后删除

## 数据存储

服务启动时会自动初始化以下表：

### `users`

| 字段 | 说明 |
| --- | --- |
| `openid` | 主键 |
| `username` | H5 用户名 |
| `passwordHash` | 密码哈希 |
| `nickname` | 昵称 |
| `avatarUrl` | 头像 |
| `model` | 默认模型 |
| `lastLogin` | 最后登录时间 |

### `sessions`

| 字段 | 说明 |
| --- | --- |
| `id` | 自增主键 |
| `openid` | 用户标识 |
| `title` | 会话标题 |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

### `chat_records`

| 字段 | 说明 |
| --- | --- |
| `id` | 自增主键 |
| `session_id` | 所属会话 |
| `role` | `user` / `assistant` |
| `content` | 文本内容 |
| `type` | `text` / `image` / `audio` |
| `media` | 媒体文件路径 |
| `reasoning_content` | 推理内容 |
| `created_at` | 创建时间 |
| `liked` | 点赞状态 |

## whisper.cpp 准备方式

如果需要启用语音识别，在 `wechat-ai-backend` 目录执行：

```bash
git clone https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp
bash ./models/download-ggml-model.sh tiny
mkdir build
cd build
cmake ..
make -j4
```

默认要求如下：

- 可执行文件：`whisper.cpp/build/bin/whisper-cli`
- 模型文件：`whisper.cpp/models/ggml-tiny.bin`

如果你将 `whisper.cpp` 放在其他路径，需要显式设置 `WHISPER_ROOT`。

## 开发约束

- `routes/` 只挂路由，不放重业务逻辑
- `controllers/` 负责参数与响应
- `services/` 负责业务编排
- `repositories/` 负责 SQL 读写
- Swagger 文档统一从 `docs/swagger/*.js` 汇总

## 部署说明

- 生产环境默认不启用 CORS，推荐由 Nginx 或同域部署解决跨域问题
- `/uploads` 为静态资源目录，需要在反向代理中保留可访问路径
- 若前端使用 SSE，网关需关闭缓冲并适当放宽超时
- SQLite 适合单机部署，若并发与数据量继续增长，需要评估迁移数据库

## 已知限制

- 当前没有自动化测试
- 数据库 schema 通过启动时建表与 `ALTER TABLE` 维护，没有独立迁移工具
- `/api/ai/models` 依赖上游模型服务的 `models.list()` 能力
- 语音转写强依赖本地 `whisper.cpp` 环境，部署时要注意二进制与模型文件一致

## 相关文档

- 仓库入口说明：`../README.md`
- 前端说明：`../wechat-ai-fontend/README.md`
