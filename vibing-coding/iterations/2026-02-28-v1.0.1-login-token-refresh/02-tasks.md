# 02 Tasks

前端任务
- 在 `wechat-ai-fontend/src/utils/api.ts` 增加 refresh 接口地址
- 在 `wechat-ai-fontend/src/utils/request.ts` 加入 401 处理：调用 refresh 后重试一次
- 在 `wechat-ai-fontend/src/hook/useChatAuth.ts` 优先读取本地 token，失败再走 H5 登录
- 对登录失败/无权限给出明确提示（Element Plus 弹窗或提示条）

后端任务
- 核对 `POST /api/user/refresh` 响应结构（`{ token }`）并保证状态码一致
- 如有需要，补充 swagger 文档说明

联调任务
- 模拟过期 token 调用 `/api/ai/sessions`，验证自动刷新与重试
- 正常登录后调用 `/api/ai/chat`，确认流式接口不受影响

文档任务
- 更新 `AGENTS.md`：说明 refresh 行为
- 更新 `wechat-ai-fontend/README.md`：新增登录态说明
