# 微信AI后端项目技术文档

## 1. 项目概述

本项目是一个基于Node.js开发的微信AI聊天后端系统，主要为微信小程序提供AI聊天服务支持。系统实现了用户认证、AI聊天会话管理、消息记录存储等核心功能，支持与多种AI模型的交互，并提供流式响应机制以提升用户体验。

### 1.1 主要功能

- 微信小程序用户登录与认证
- AI聊天会话管理（创建、查询、删除）
- 聊天消息记录存储与管理
- 支持多种AI模型调用
- 流式响应（SSE）提升用户体验
- 消息点赞与重新生成功能
- 语音转文本功能（支持中文语音识别）

## 2. 技术栈

### 2.1 核心技术

| 技术/框架 | 版本 | 用途 |
|----------|------|------|
| Node.js | - | 运行环境 |
| Express.js | 5.1.0 | Web框架 |
| SQLite3 | 5.1.7 | 数据库 |
| JWT | 9.0.2 | 用户认证 |
| OpenAI SDK | 6.9.0 | AI模型调用 |

### 2.2 依赖列表

```json
{
  "dependencies": {
    "axios": "^1.13.2",
    "body-parser": "^2.2.0",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^5.1.0",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "openai": "^6.9.0",
    "sqlite3": "^5.1.7",
    "whisper-node": "^1.1.1"
  },
  "devDependencies": {
    "nodemon": "^3.1.11"
  }
}
```

## 3. 系统架构

### 3.1 整体架构

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  微信小程序客户端  │────▶│    Express服务器    │────▶│     OpenAI API    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                            │
                            ▼
                      ┌─────────────────┐
                      │    SQLite3数据库   │
                      └─────────────────┘
```

### 3.2 模块划分

```
wechat-ai-backend/
├── index.js                 # 项目入口文件
├── config.js                # 配置文件
├── db.js                    # 数据库连接与初始化
├── middleware/
│   └── auth.js              # 认证中间件
├── routes/
│   ├── user.js              # 用户相关路由
│   └── ai.js                # AI聊天相关路由
├── package.json
└── .env                     # 环境变量配置（未提交）
```

## 4. 数据库设计

### 4.1 表结构

#### 4.1.1 用户表 (users)

| 字段名 | 数据类型 | 约束 | 描述 |
|-------|---------|------|------|
| openid | TEXT | PRIMARY KEY | 用户唯一标识（微信openid或h5:用户名） |
| username | TEXT | UNIQUE | H5登录账号 |
| passwordHash | TEXT | | H5登录密码哈希 |
| nickname | TEXT | | 用户昵称 |
| avatarUrl | TEXT | | 用户头像URL |
| model | TEXT | DEFAULT 'deepseek-chat' | 默认使用的AI模型 |
| lastLogin | TEXT | | 最后登录时间 |

#### 4.1.2 会话表 (sessions)

| 字段名 | 数据类型 | 约束 | 描述 |
|-------|---------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 会话ID |
| openid | TEXT | FOREIGN KEY REFERENCES users(openid) | 用户唯一标识 |
| title | TEXT | | 会话标题 |
| created_at | TEXT | | 创建时间 |
| updated_at | TEXT | | 更新时间 |

#### 4.1.3 聊天记录表 (chat_records)

| 字段名 | 数据类型 | 约束 | 描述 |
|-------|---------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 消息ID |
| session_id | INTEGER | FOREIGN KEY REFERENCES sessions(id) | 会话ID |
| role | TEXT | | 角色（user/assistant） |
| content | TEXT | | 消息内容 |
| type | TEXT | DEFAULT 'text' | 消息类型（text/image/audio） |
| media | TEXT | | 媒体内容（URL或dataURL） |
| reasoning_content | TEXT | | 思考链内容 |
| created_at | TEXT | | 创建时间 |
| liked | INTEGER | DEFAULT 0 | 是否点赞（0/1） |

## 5. API接口文档

### 5.1 用户相关接口

#### 5.1.1 用户登录

- **接口地址**: `/api/user/login`
- **请求方式**: POST
- **请求参数**:
  ```json
  {
    "code": "微信小程序登录code",
    "userInfo": {
      "nickName": "用户昵称",
      "avatarUrl": "用户头像URL"
    }
  }
  ```
- **响应示例**:
  ```json
  {
    "token": "JWT令牌",
    "msg": "登录成功"
  }
  ```
- **说明**: 若账号不存在将自动注册

#### 5.1.2 H5账号密码登录

- **接口地址**: `/api/user/login/h5`
- **请求方式**: POST
- **请求参数**:
  ```json
  {
    "username": "登录账号",
    "password": "登录密码",
    "userInfo": {
      "nickName": "用户昵称",
      "avatarUrl": "用户头像URL"
    }
  }
  ```
- **响应示例**:
  ```json
  {
    "token": "JWT令牌",
    "msg": "登录成功"
  }
  ```

#### 5.1.3 获取用户信息

- **接口地址**: `/api/user/info`
- **请求方式**: GET
- **请求头**: `Authorization: Bearer {token}`
- **响应示例**:
  ```json
  {
    "msg": "获取成功",
    "user": {
      "openid": "用户唯一标识",
      "username": "H5登录账号",
      "nickname": "用户昵称",
      "avatarUrl": "用户头像URL",
      "model": "deepseek-chat",
      "lastLogin": "2024-01-01 12:00:00"
    }
  }
  ```

#### 5.1.4 刷新Token

- **接口地址**: `/api/user/refresh`
- **请求方式**: POST
- **请求头**: `Authorization: Bearer {token}`
- **响应示例**:
  ```json
  {
    "token": "新的JWT令牌",
    "msg": "刷新成功"
  }
  ```

### 5.2 AI聊天相关接口

#### 5.2.1 语音转文本

- **接口地址**: `/api/ai/speech-to-text`
- **请求方式**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**: Form Data
  - `audio`: 语音文件（支持wav、mp3等格式）
- **响应示例**:
  ```json
  {
    "msg": "语音识别成功",
    "text": "识别出的文本内容"
  }
  ```

#### 5.2.2 AI聊天（支持图片消息）

- **接口地址**: `/api/ai/chat`
- **请求方式**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求参数**（JSON）:
  ```json
  {
    "messages": [
      {
        "role": "user",
        "type": "image",
        "imageUrl": "https://example.com/sample.png",
        "prompt": "请总结图片内容"
      },
      {
        "role": "user",
        "type": "audio",
        "audioUrl": "https://example.com/sample.wav",
        "content": "这里是语音转文字内容"
      },
      {
        "role": "user",
        "content": "聊天内容"
      }
    ],
    "model": "deepseek-chat",
    "stream": true,
    "sessionId": "会话ID（可选）",
    "lang": "chi_sim"
  }
  ```
- **请求参数**（Form Data）:
  - `messages`: JSON 字符串的消息数组
  - `image`: 图片文件（当 type=image 时可上传）
- **响应类型**: 流式响应 (text/event-stream)
- **响应示例**:
  ```
  data: {"type":"delta","text":"AI回复内容片段"}
  data: {"type":"thinking","thinking":"思考链内容"}
  data: {"type":"done","sessionId":"会话ID"}
  ```

#### 5.2.3 Mock聊天（测试用）

- **接口地址**: `/api/ai/chat-mock`
- **请求方式**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求参数**:
  ```json
  {
    "stream": true,
    "sessionId": "会话ID（可选）"
  }
  ```
- **响应类型**: 流式响应 (text/event-stream)

#### 5.2.4 获取模型列表

- **接口地址**: `/api/ai/models`
- **请求方式**: GET
- **请求头**: `Authorization: Bearer {token}`
- **响应示例**:
  ```json
  {
    "models": {
      "object": "list",
      "data": [
        {
          "id": "deepseek-chat",
          "object": "model"
        }
        // 更多模型...
      ]
    }
  }
  ```

### 5.3 会话管理接口

#### 5.3.1 获取会话列表

- **接口地址**: `/api/ai/sessions`
- **请求方式**: GET
- **请求头**: `Authorization: Bearer {token}`
- **响应示例**:
  ```json
  {
    "sessions": [
      {
        "id": "会话ID",
        "title": "会话标题",
        "updated_at": "2024-01-01 12:00:00"
      }
      // 更多会话...
    ]
  }
  ```

#### 5.3.2 获取会话消息

- **接口地址**: `/api/ai/sessions/:id/messages`
- **请求方式**: GET
- **请求头**: `Authorization: Bearer {token}`
- **响应示例**:
  ```json
  {
    "messages": [
      {
        "id": "消息ID",
        "role": "user",
        "content": "用户消息内容",
        "reasoning_content": null,
        "created_at": "2024-01-01 12:00:00",
        "liked": 0
      },
      {
        "id": "消息ID",
        "role": "assistant",
        "content": "AI回复内容",
        "reasoning_content": "思考链内容",
        "created_at": "2024-01-01 12:01:00",
        "liked": 1
      }
      // 更多消息...
    ]
  }
  ```

#### 5.3.3 删除会话

- **接口地址**: `/api/ai/sessions/:id/delete`
- **请求方式**: POST
- **请求头**: `Authorization: Bearer {token}`
- **响应示例**:
  ```json
  {
    "msg": "删除成功",
    "sessionId": "会话ID"
  }
  ```

### 5.4 消息管理接口

#### 5.4.1 点赞消息

- **接口地址**: `/api/ai/messages/:id/like`
- **请求方式**: POST
- **请求头**: `Authorization: Bearer {token}`
- **响应示例**:
  ```json
  {
    "msg": "操作成功",
    "messageId": "消息ID",
    "liked": 1
  }
  ```

#### 5.4.2 重新生成消息

- **接口地址**: `/api/ai/messages/:id/regenerate`
- **请求方式**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求参数**:
  ```json
  {
    "stream": true,
    "model": "deepseek-chat"
  }
  ```
- **响应类型**: 流式响应 (text/event-stream)

## 6. 核心功能实现

### 6.1 用户认证流程

**小程序登录**：
1. 用户通过微信小程序获取登录code
2. 调用`/api/user/login`接口，传入code和用户信息
3. 后端调用微信API获取openid
4. 生成JWT令牌返回给客户端
5. 客户端后续请求携带JWT令牌进行认证

**H5账号密码登录**：
1. 用户输入账号密码
2. 调用`/api/user/login/h5`接口，传入username和password（userInfo可选）
3. 后端校验账号密码（用户不存在则自动注册）
4. 生成JWT令牌返回给客户端
5. 客户端后续请求携带JWT令牌进行认证

### 6.2 AI聊天流程

1. 客户端发送聊天请求，包含用户消息和会话信息
2. 后端获取或创建会话
3. 保存用户消息到数据库
4. 调用AI模型（支持流式响应）
5. 实时返回AI回复给客户端
6. 保存AI回复到数据库

### 6.3 流式响应实现

使用Server-Sent Events (SSE) 技术实现流式响应，提升用户体验：

1. 设置响应头为`text/event-stream`
2. 调用AI模型时启用流式模式
3. 将AI回复分块发送给客户端
4. 支持思考链内容的实时推送
5. 流结束时发送结束事件

## 7. 配置说明

### 7.1 环境变量配置 (.env)

```
WX_APP_ID=微信小程序AppID
WX_APP_SECRET=微信小程序AppSecret
JWT_SECRET=JWT密钥
PORT=服务器端口
DB_FILE=数据库文件路径
OPENAI_API_KEY=OpenAI API密钥
OPENAI_BASE_URL=OpenAI API基础URL
```

### 7.2 配置文件 (config.js)

配置文件用于加载和管理环境变量，提供统一的配置访问接口。

## 8. 部署与运行

### 8.1 安装依赖

```bash
pnpm install
```

### 8.2 启动开发服务器

```bash
pnpm run dev
```

### 8.3 生产环境部署

1. 确保环境变量配置正确
2. 启动服务器

```bash
node index.js
```

## 9. 安全注意事项

1. 保护敏感信息：不要将API密钥等敏感信息硬编码到代码中
2. JWT安全：设置合理的过期时间，定期更换密钥
3. 输入验证：对所有用户输入进行严格验证
4. 权限控制：确保用户只能访问自己的资源
5. HTTPS：生产环境使用HTTPS加密传输

## 10. 扩展与维护

### 10.1 支持更多AI模型

在`config.js`中配置新的模型，在`routes/ai.js`中更新模型调用逻辑。

### 10.2 数据库迁移

如需切换到其他数据库（如MySQL、PostgreSQL），需要：
1. 安装相应的数据库驱动
2. 更新`db.js`中的数据库连接代码
3. 修改SQL语句以适应新数据库

### 10.3 性能优化

1. 增加缓存层，减少数据库查询
2. 优化AI模型调用，减少响应时间
3. 实现负载均衡，支持高并发

## 11. 总结

本项目实现了一个功能完整的微信AI后端系统，提供了用户认证、AI聊天、会话管理等核心功能。系统采用模块化设计，具有良好的可扩展性和维护性。通过流式响应技术，提升了用户体验。该系统可以作为微信小程序的AI聊天后端，支持多种AI模型，满足不同的业务需求。
