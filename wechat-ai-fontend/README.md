# wechat-ai-fontend 前端说明

`wechat-ai-fontend` 是本仓库的 H5 聊天前端，基于 Vue 3 + TypeScript + Vite 构建，面向手机端聊天场景，依赖 `wechat-ai-backend` 提供登录、会话、流式对话、语音转写等接口。

## 项目定位

- 提供 H5 端 AI 对话界面
- 通过 SSE 实时接收模型回复
- 支持历史会话、图片提问、语音转文字、消息点赞与重新生成
- 默认对接同仓库后端，不直接请求 OpenAI

## 当前能力

- H5 自动登录
  - 页面加载时优先读取 URL 中的 `token`
  - 如果 URL 未传 `token`，会自动调用 `/api/user/login/h5`
  - 登录成功后将 JWT 写入 `localStorage.token`
- 流式对话
  - 调用 `/api/ai/chat`
  - 通过 SSE 解析 `delta`、`thinking`、`done` 事件
  - 支持展示推理内容折叠区
- 会话管理
  - 获取历史会话列表
  - 加载指定会话消息
  - 删除会话
- 多模态输入
  - 文本消息
  - 图片上传后发起对话
  - 语音录制并调用后端转写
- 消息交互
  - Markdown 渲染
  - 代码块复制与 HTML 预览
  - 助手消息点赞
  - 助手消息重新生成

## 技术栈

- Vue 3
- TypeScript
- Vite
- Element Plus
- `markdown-it`
- `highlight.js`
- `recordrtc`
- Sass

## 目录结构

```text
wechat-ai-fontend/
├── public/                      # 静态资源
├── src/
│   ├── App.vue                  # 页面入口，组合聊天、录音、鉴权能力
│   ├── assets/                  # 图标与图片资源
│   ├── components/              # 聊天 UI 组件
│   ├── hook/
│   │   ├── useChatAuth.ts       # H5 自动登录与用户信息处理
│   │   ├── useChatConversation.ts # 会话与消息主流程
│   │   ├── useChatRecording.ts  # 录音与语音识别请求
│   │   ├── useChatScroll.ts     # 滚动到底部逻辑
│   │   └── useChatStream.ts     # SSE 流式响应处理
│   ├── utils/
│   │   ├── api.ts               # 接口路径与后端基地址拼接
│   │   ├── request.ts           # 普通请求封装
│   │   ├── streamRequest.ts     # SSE 请求封装
│   │   ├── markdown.ts          # Markdown 渲染配置
│   │   ├── media.ts             # 图片 URL 处理
│   │   └── type.ts              # 业务类型定义
│   ├── style.scss               # 全局主题样式
│   └── main.ts                  # 应用入口
├── package.json
└── README.md
```

## 运行要求

- Node.js `>= 20.18.0`
- npm `>= 10`
- 已启动可访问的后端服务

## 环境变量

前端只依赖一个运行时基地址：

```bash
VITE_OPENAI_BASE_URL=http://localhost:3000
```

说明：

- 虽然变量名叫 `VITE_OPENAI_BASE_URL`，实际含义是“后端 API 服务地址”
- 前端会将它与 `/api/user/*`、`/api/ai/*`、`/uploads/*` 拼接
- 推荐写在 `wechat-ai-fontend/.env.local` 或 `wechat-ai-fontend/.env.development`

## 快速开始

在仓库根目录启动：

```bash
npm install
npm run dev:frontend
```

或者在前端目录单独启动：

```bash
cd wechat-ai-fontend
npm install
npm run dev
```

默认开发地址：

```text
http://localhost:5173
```

生产构建：

```bash
cd wechat-ai-fontend
npm run build
```

本地预览构建结果：

```bash
cd wechat-ai-fontend
npm run preview
```

## 与后端的接口约定

前端当前直接依赖以下接口：

| 能力 | 方法 | 路径 |
| --- | --- | --- |
| H5 登录 | `POST` | `/api/user/login/h5` |
| 获取会话列表 | `GET` | `/api/ai/sessions` |
| 获取会话消息 | `GET` | `/api/ai/sessions/:id/messages` |
| 删除会话 | `POST` | `/api/ai/sessions/:id/delete` |
| 发起对话 | `POST` | `/api/ai/chat` |
| 语音转文字 | `POST` | `/api/ai/speech-to-text` |
| 点赞消息 | `POST` | `/api/ai/messages/:id/like` |

补充说明：

- 除 `/api/user/login/h5` 外，其余请求都依赖 `Authorization: Bearer <token>`
- 普通文本对话使用 JSON 请求
- 图片提问使用 `multipart/form-data`，字段包含 `messages`、`image`、`model`、`stream`、`sessionId`
- 历史图片消息通过 `VITE_OPENAI_BASE_URL + /uploads/...` 访问

## 登录与鉴权说明

当前前端内置了一套 H5 调试登录逻辑：

```json
{
  "username": "h5_test",
  "password": "pass123"
}
```

实际行为如下：

1. 如果页面 URL 带有 `token`，前端直接使用该 token。
2. 如果 URL 同时带有 `token`、`nickname`、`avatarUrl`，会覆盖页面展示的用户信息。
3. 如果没有 `token`，前端会自动调用 `/api/user/login/h5`。
4. 登录成功后，token 保存到 `localStorage.token`，后续请求自动携带。

如果后端关闭了这个调试账号，前端也需要同步调整 `src/hook/useChatAuth.ts`。

## 核心交互流程

### 文本对话

1. 用户输入文本并发送
2. 前端先插入本地用户消息
3. 调用 `/api/ai/chat`
4. 监听 SSE 事件流
5. 按字符平滑渲染助手回复
6. 收到 `done` 后更新 `sessionId`

### 图片提问

1. 用户选择图片
2. 前端生成本地预览图
3. 以 `multipart/form-data` 上传图片和消息体
4. 后端保存图片并返回流式回复

### 语音输入

1. 前端录音后生成音频 Blob
2. 上传到 `/api/ai/speech-to-text`
3. 后端返回识别文本
4. 前端将识别结果回填到输入框

## 主要文件说明

| 文件 | 说明 |
| --- | --- |
| `src/App.vue` | 页面总装配，挂载消息流、录音、会话列表 |
| `src/hook/useChatConversation.ts` | 文本/图片消息发送、历史消息切换、点赞与重新生成功能入口 |
| `src/hook/useChatStream.ts` | 处理 SSE 增量文本与推理内容 |
| `src/hook/useChatAuth.ts` | H5 自动登录、URL token 注入 |
| `src/hook/useChatRecording.ts` | 录音和语音转写上传 |
| `src/utils/api.ts` | 所有 API 地址定义 |
| `src/utils/request.ts` | JSON / FormData 请求封装 |
| `src/utils/streamRequest.ts` | SSE 读取与事件分发 |
| `src/style.scss` | 全局样式与主题变量 |

## 构建与部署建议

- 前端生产环境建议与后端挂在同一域名下，通过 Nginx 反向代理 `/api` 和 `/uploads`
- 如果前后端跨域部署，需要确认后端或网关已正确处理 CORS
- 打包产物位于 `wechat-ai-fontend/dist`

## 已知限制

- 当前没有自动化测试
- 模型选项在前端写死为 `deepseek-chat` 和 `deepseek-reasoner`
- H5 登录默认依赖内置测试账号，不适合直接作为正式生产登录方案
- 语音识别是否可用取决于后端 `whisper.cpp` 是否已正确安装

## 相关文档

- 仓库入口说明：`../README.md`
- 后端说明：`../wechat-ai-backend/README.md`
