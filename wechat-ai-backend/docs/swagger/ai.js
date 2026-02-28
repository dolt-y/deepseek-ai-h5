export const aiDocs = {};

/**
 * @swagger
 * components:
 *   schemas:
 *     ChatMessage:
 *       type: object
 *       required:
 *         - role
 *       properties:
 *         type:
 *           type: string
 *           enum: [text, image, audio]
 *           description: 消息类型（image 会进行 OCR 识别）
 *         role:
 *           type: string
 *           enum: [user, assistant, system]
 *         content:
 *           type: string
 *           description: 消息正文（text 消息必填）
 *         imageUrl:
 *           type: string
 *           description: 图片 URL（type=image 时可用）
 *         imageBase64:
 *           type: string
 *           description: 图片 base64（type=image 时可用）
 *         audioUrl:
 *           type: string
 *           description: 音频 URL（type=audio 时可用）
 *         audioBase64:
 *           type: string
 *           description: 音频 base64（type=audio 时可用）
 *         prompt:
 *           type: string
 *           description: 图片识别后的追加提问
 *         lang:
 *           type: string
 *           description: OCR 语言（默认 chi_sim）
 *     ChatRequest:
 *       type: object
 *       required:
 *         - messages
 *       properties:
 *         messages:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ChatMessage'
 *         lang:
 *           type: string
 *           description: OCR 默认语言（可选）
 *         model:
 *           type: string
 *           example: deepseek-chat
 *         stream:
 *           type: boolean
 *           default: true
 *         sessionId:
 *           type: integer
 *           nullable: true
 *     ChatResponse:
 *       type: object
 *       properties:
 *         sessionId:
 *           type: integer
 *         reply:
 *           type: object
 *           properties:
 *             role:
 *               type: string
 *               example: assistant
 *             content:
 *               type: string
 *     StreamChunk:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [delta, thinking, done]
 *         text:
 *           type: string
 *         thinking:
 *           type: string
 *         sessionId:
 *           type: integer
 *     Session:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         title:
 *           type: string
 *         updated_at:
 *           type: string
 *           format: date-time
 *     Message:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         role:
 *           type: string
 *         type:
 *           type: string
 *           enum: [text, image, audio]
 *         media:
 *           type: string
 *           description: 媒体内容（图片/音频的 URL 或 dataURL）
 *         content:
 *           type: string
 *         reasoning_content:
 *           type: string
 *           nullable: true
 *         created_at:
 *           type: string
 *           format: date-time
 *         liked:
 *           type: integer
 *           enum: [0, 1]
 *     RegenerateRequest:
 *       type: object
 *       properties:
 *         stream:
 *           type: boolean
 *           default: true
 *         model:
 *           type: string
 *           example: deepseek-chat
 *     LikeResponse:
 *       type: object
 *       properties:
 *         msg:
 *           type: string
 *         messageId:
 *           type: integer
 *         liked:
 *           type: integer
 *           enum: [0, 1]
 *     SpeechToTextResponse:
 *       type: object
 *       properties:
 *         msg:
 *           type: string
 *           example: 语音识别成功
 *         text:
 *           type: string
 *     SpeechChunkResponse:
 *       type: object
 *       properties:
 *         msg:
 *           type: string
 *         fileId:
 *           type: string
 *         chunkIndex:
 *           type: integer
 *         uploadedChunks:
 *           type: integer
 *         totalChunks:
 *           type: integer
 *         assembled:
 *           type: boolean
 *         fileReady:
 *           type: string
 *           nullable: true
 *     SpeechStreamEvent:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [partial, done, error]
 *         text:
 *           type: string
 *         fileId:
 *           type: string
 *         msg:
 *           type: string
 */

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     tags: [AI]
 *     summary: 调用大模型进行对话
 *     description: 当 stream=true 时以 SSE 推送返回；否则返回完整 JSON。
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatRequest'
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - messages
 *             properties:
 *               messages:
 *                 type: string
 *                 description: JSON 字符串的 messages 数组
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: 图片文件（type=image 时可用）
 *               model:
 *                 type: string
 *               stream:
 *                 type: boolean
 *               sessionId:
 *                 type: integer
 *               lang:
 *                 type: string
 *     responses:
 *       200:
 *         description: 非流式模式响应
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatResponse'
 *           text/event-stream:
 *             schema:
 *               $ref: '#/components/schemas/StreamChunk'
 *       400:
 *         description: 参数错误
 *       500:
 *         description: AI 服务错误
 */

/**
 * @swagger
 * /api/ai/chat-mock:
 *   post:
 *     tags: [AI]
 *     summary: Mock SSE 流，便于前端调试
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stream:
 *                 type: boolean
 *                 default: true
 *               sessionId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 返回 mock 数据或开启 SSE
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatResponse'
 *           text/event-stream:
 *             schema:
 *               $ref: '#/components/schemas/StreamChunk'
 */

/**
 * @swagger
 * /api/ai/sessions:
 *   get:
 *     tags: [Session]
 *     summary: 获取当前用户的会话列表
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Session'
 *       401:
 *         description: 未认证
 */

/**
 * @swagger
 * /api/ai/sessions/{id}/messages:
 *   get:
 *     tags: [Session]
 *     summary: 获取指定会话的消息记录
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 会话 ID
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *       401:
 *         description: 未认证
 */

/**
 * @swagger
 * /api/ai/sessions/{id}/delete:
 *   post:
 *     tags: [Session]
 *     summary: 删除会话及其消息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 要删除的会话 ID
 *     responses:
 *       200:
 *         description: 删除成功
 *       401:
 *         description: 未认证
 *       404:
 *         description: 会话不存在或无权限
 */

/**
 * @swagger
 * /api/ai/models:
 *   get:
 *     tags: [AI]
 *     summary: 获取可用模型列表
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 *       500:
 *         description: 获取失败
 */

/**
 * @swagger
 * /api/ai/messages/{id}/like:
 *   post:
 *     tags: [Session]
 *     summary: 点赞或取消点赞消息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 消息 ID
 *     responses:
 *       200:
 *         description: 操作成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LikeResponse'
 *       401:
 *         description: 未认证
 *       404:
 *         description: 消息不存在
 */

/**
 * @swagger
 * /api/ai/messages/{id}/regenerate:
 *   post:
 *     tags: [AI]
 *     summary: 重新生成指定 AI 消息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 需要重生成的消息 ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegenerateRequest'
 *     responses:
 *       200:
 *         description: 非流式刷新成功
 *       401:
 *         description: 未认证
 *       404:
 *         description: 消息不存在
 *       500:
 *         description: 重生成失败
 */

/**
 * @swagger
 * /api/ai/speech-to-text:
 *   post:
 *     tags: [AI]
 *     summary: 语音识别（基于本地 whisper.cpp）
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - audio
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: 音频文件（wav、mp3）
 *     responses:
 *       200:
 *         description: 识别成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SpeechToTextResponse'
 *       400:
 *         description: 未提供音频
 *       500:
 *         description: 识别失败
 */


/**
 * @swagger
 * /api/ai/speech-upload/chunk:
 *   post:
 *     tags: [AI]
 *     summary: 上传音频分片（支持断点续传）
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - fileId
 *               - chunkIndex
 *               - totalChunks
 *               - chunk
 *             properties:
 *               fileId:
 *                 type: string
 *                 description: 客户端生成的文件唯一标识
 *               chunkIndex:
 *                 type: integer
 *                 description: 分片序号（从 0 开始）
 *               totalChunks:
 *                 type: integer
 *                 description: 分片总数
 *               chunk:
 *                 type: string
 *                 format: binary
 *                 description: 当前分片内容
 *     responses:
 *       200:
 *         description: 分片上传成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SpeechChunkResponse'
 *       400:
 *         description: 参数或分片文件错误
 */

/**
 * @swagger
 * /api/ai/speech-to-text/stream/{fileId}:
 *   get:
 *     tags: [AI]
 *     summary: 实时转写已上传的音频（SSE）
 *     description: 建立 SSE 连接，服务端会持续返回 partial/done 事件。
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 上传时使用的文件 ID
 *     responses:
 *       200:
 *         description: text/event-stream，包含实时转写内容
 *         content:
 *           text/event-stream:
 *             schema:
 *               $ref: '#/components/schemas/SpeechStreamEvent'
 *       404:
 *         description: 文件未找到
 */
