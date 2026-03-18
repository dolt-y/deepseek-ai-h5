# 02 Tasks

前端任务
- 在 `InputArea.vue` 实现图片文件选择并触发 `upload-image` 事件
- 在 `App.vue` 与 `useChatConversation.ts` 接入图片发送流程（用户消息类型为 `image`）
- 在 `useChatStream.ts` 与 `streamRequest.ts` 支持 multipart 请求（`messages + image`）和会话 ID 回填
- 修正历史消息映射逻辑，按 `type/media` 渲染图片而非强制文本
- 补充发送中状态：图片上传/OCR/模型回复阶段保持 loading 可见

后端任务
- 在 `messageService.js` 增加图片落盘逻辑，统一生成可访问 URL
- 在 `index.js` 挂载图片静态目录（如 `/uploads`）
- 图片消息归一化流程中执行：解析图片 -> 落盘 -> OCR -> 拼接 prompt + OCR 文本 -> 传给模型
- 落库时保证 `chat_records.type='image'` 且 `media` 为图片 URL

联调任务
- 验证上传图片后 UI 立即显示图片消息，助手进入“思考中/loading”
- 验证服务端返回后助手消息正常流式显示
- 验证刷新页面后历史会话中的图片消息可正常回显

文档任务
- 更新根 README 与后端 README 的图片/OCR 行为说明（以统一文档为准）
