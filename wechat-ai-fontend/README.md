# AI-H5 · 智能对话助手应用

[![Vue 3](https://img.shields.io/badge/Vue-3.5.13-brightgreen)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3.5-green)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](#)

一个基于 Vue 3 + TypeScript 开发的 AI 对话助手应用，支持流式响应、会话管理和多模型切换。

## ✨ 核心功能

### � 流式响应
- 支持 SSE 流式数据接收，实时显示 AI 回复
- 分块解析与缓冲，处理不完整的数据块
- 使用 `requestAnimationFrame` 优化渲染性能

### 💬 会话管理
- 支持创建、切换、删除历史会话
- 会话间相互隔离，独立存储上下文
- 自动保存消息历史，可随时查看

### 🎯 多模型支持
- 提供两种 AI 模型：
  - 快速问答模型（deepseek-chat）
  - 深度思考模型（deepseek-reasoner）
- 可在对话过程中动态切换模型

### 📝 Markdown 渲染
- 支持代码块、表格、列表、引用等 Markdown 语法
- 代码高亮显示
- 安全的 HTML 渲染，链接自动在新窗口打开

### 🎨 交互功能
- AI 回复时显示加载动画
- 自动滚动到最新消息
- 消息支持复制、点赞、重新生成

## 🏗️ 项目结构

```
├─ src
│  ├─ App.vue                  # 主应用组件
│  ├─ assets                   # 静态资源
│  ├─ components               # 组件目录
│  │  ├─ HistroySessions.vue   # 历史会话组件
│  │  ├─ InputArea.vue         # 输入区域组件
│  │  ├─ MessageItem.vue       # 消息项组件
│  │  ├─ RecordingIndicator.vue # 录音指示器组件
│  │  └─ SettingsPanel.vue     # 设置面板组件
│  ├─ hook                     # 自定义 Hook
│  │  ├─ useChatRecording.ts   # 聊天录音 Hook
│  │  ├─ useChatScroll.ts      # 聊天滚动 Hook
│  │  └─ useChatStream.ts      # 聊天流处理 Hook
│  ├─ utils                    # 工具函数
│  │  ├─ api.ts                # API 配置
│  │  ├─ markdown.ts           # Markdown 处理
│  │  ├─ request.ts            # 请求封装
│  │  ├─ streamRequest.ts      # 流式请求处理
│  │  ├─ tools.ts              # 工具函数
│  │  └─ type.ts               # 类型定义
│  ├─ main.ts                  # 应用入口
│  ├─ style.scss               # 全局样式
│  └─ vite-env.d.ts            # Vite 类型声明
```

## 🔧 技术栈

| 技术 | 版本 | 用途 |
|-----|------|------|
| Vue | 3.5.13 | 前端框架 |
| TypeScript | 5.8 | 类型安全 |
| Vite | 6.3.5 | 构建工具 |
| Markdown-it | 14.1.0 | Markdown 渲染 |
| highlight.js | 内置 | 代码高亮 |
| SCSS | 1.94.2 | 样式预处理 |
| Element Plus | 2.10.4 | UI 组件库 |

## 📥 快速开始

### 前置要求
- Node.js >= 16
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 开发服务器
```bash
npm run dev
```
访问 `http://localhost:5173`

### 生产构建
```bash
npm run build
```

构建输出到 `dist/` 目录

### 预览构建结果
```bash
npm run preview
```

## 🎯 核心业务流程

### 对话流程
1. 用户输入消息并发送
2. 创建用户消息并显示
3. 调用 AI 接口获取流式响应
4. 创建助手消息，显示加载状态
5. 接收 SSE 数据流，实时渲染内容
6. 流结束后更新消息状态
7. 用户可对消息进行操作（复制、点赞、重新生成）

### 会话管理流程
1. 新建会话
2. 获取会话 ID，用于后续对话关联
3. 切换历史会话时加载对应消息
4. 智能滚动到消息底部

## 🔐 API 接口

### 对话接口
```typescript
POST /api/ai/chat
Body: {
  messages: Array<{ role: string; content: string }>,
  sessionId?: string | number,
  stream: true,
  model: string  // "deepseek-chat" | "deepseek-reasoner"
}
Response: 流式 SSE
  data: 文本块
  [可选] event: 事件类型
  [可选] id: 事件 ID
```

### 会话接口
```typescript
POST /api/ai/sessions
Body: { title: string; summary?: string }
Response: { session: { id: string | number; ... } }

GET /api/ai/sessions/{id}/messages
Response: { messages: Array<HistoryMessage> }
  HistoryMessage = {
    role: "assistant" | "user",
    content: string,
    created_at?: string
  }
```

## 📱 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🔄 后续开发方向

- 完善语音输入功能
- 支持消息搜索与过滤
- 实现对话记录导出
- 添加 PWA 支持
- 完善用户认证体系
- 集成更多 AI 模型

## 📄 主要文件说明

| 文件 | 说明 |
|-----|------|
| `streamRequest.ts` | 流式数据解析核心实现 |
| `App.vue` | 主业务逻辑，包含对话流程和会话管理 |
| `MessageItem.vue` | 消息渲染与交互处理 |
| `InputArea.vue` | 输入框、模型切换、会话操作 |
| `markdown.ts` | Markdown 渲染配置 |
| `style.scss` | 全局样式 |

## 🤝 贡献

欢迎提交 PR 和 Issue！

## 📝 许可证

MIT License

---
**最后更新**: 2025年12月8日  
**Repository**: [github.com/dolt-y/AI-H5](https://github.com/dolt-y/AI-H5)