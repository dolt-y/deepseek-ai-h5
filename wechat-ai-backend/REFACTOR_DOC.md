# 重构说明文档

## 目标
- **分层解耦**：路由、控制器、业务、数据访问分离，降低单文件复杂度
- **易维护与扩展**：新增能力只需在指定层新增/修改
- **保持行为一致**：接口路径、响应结构与数据库不变

## 约束与范围
- **不修改数据库表结构**（仅整理代码组织与调用）
- **不改变现有接口行为**（响应字段/状态码保持一致）

## 新目录结构
```
.
├── controllers/              # 请求/响应处理
│   ├── aiController.js
│   └── userController.js
├── services/                 # 业务逻辑聚合
│   ├── aiService.js
│   ├── speechService.js
│   └── userService.js
├── repositories/             # 数据访问层（SQL）
│   ├── messageRepository.js
│   ├── sessionRepository.js
│   └── userRepository.js
├── clients/                  # 外部服务 SDK
│   └── openaiClient.js
├── utils/                    # 纯工具函数
│   ├── error.js
│   ├── file.js
│   ├── password.js
│   ├── sse.js
│   ├── streamBuffer.js
│   └── time.js
├── errors/                   # 自定义错误类型
│   └── AppError.js
├── routes/                   # 路由挂载
│   ├── ai.js
│   └── user.js
├── middleware/               # 认证/上传中间件
│   ├── auth.js
│   ├── upload.js
│   └── whisper.js
├── db.js                      # 数据库连接与初始化
├── config.js                  # 配置读取
├── index.js                   # 服务启动入口
└── docs/                      # Swagger 与技术文档
```

## 分层职责
- **routes/**：只负责路由路径与中间件组合
- **controllers/**：参数校验、状态码与响应
- **services/**：业务逻辑编排（登录、会话、AI 调用等）
- **repositories/**：唯一可写 SQL 的层
- **clients/**：外部 SDK 客户端封装
- **utils/**：无副作用的工具函数
- **errors/**：统一可识别的业务异常

## 关键流程（示例）
### H5 登录
1. `routes/user.js` → `controllers/userController.js`
2. `userService.loginH5()` 校验账号 → `userRepository` 读写
3. 成功返回 token；失败抛出 `AppError`

### AI 聊天（流式）
1. `routes/ai.js` → `controllers/aiController.js`
2. `aiService.chat()`：
   - 读取会话历史
   - 写入用户消息
   - 调 OpenAI 流式接口
   - `streamBuffer` 合并片段并回调 `emit`
3. controller 负责 SSE 写回与结束事件

## 改造收益
- **单文件体积显著缩减**（原 `routes/ai.js` 重逻辑拆分）
- **业务逻辑更聚焦**：逻辑集中在 service，数据访问集中在 repository
- **测试友好**：service 层可以单测/模拟外部依赖

## 后续扩展建议
- 在 `services/` 增加新业务入口，避免在 routes 中写逻辑
- 新增表/字段只需在 `repositories/` 增加查询
- 可进一步补充：
  - 请求参数统一校验（例如 zod/joi）
  - 统一日志与错误处理
  - TypeScript 化
