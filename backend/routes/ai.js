import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createRateLimit, userOrIpKey } from '../middleware/rateLimit.js';
import { upload, uploadImage } from '../middleware/upload.js';
import { config } from '../config.js';
import {
  chatController,
  getSessionsController,
  getSessionMessagesController,
  deleteSessionController,
  getModelsController,
  likeMessageController,
  regenerateMessageController,
  createSpeechToTextJobController,
  getSpeechToTextJobController
} from '../controllers/aiController.js';

export const aiRouter = express.Router();
const aiRateLimit = createRateLimit({
  prefix: 'ai',
  ...config.rateLimit.ai,
  keyGenerator: userOrIpKey
});
const speechRateLimit = createRateLimit({
  prefix: 'speech',
  ...config.rateLimit.speech,
  keyGenerator: userOrIpKey
});

// 聊天接口成本最高，先鉴权再限流，最后处理 multipart 图片。
aiRouter.post('/chat', authMiddleware, aiRateLimit, uploadImage.single('image'), chatController);

// 会话读取接口只做鉴权，避免普通查询被 AI 限流影响。
aiRouter.get('/sessions', authMiddleware, getSessionsController);
aiRouter.get('/sessions/:id/messages', authMiddleware, getSessionMessagesController);
aiRouter.post('/sessions/:id/delete', authMiddleware, deleteSessionController);
aiRouter.get('/models', authMiddleware, getModelsController);

// AI 消息操作会触发上游模型或写入行为，使用 AI 限流保护服务。
aiRouter.post('/messages/:id/like', authMiddleware, aiRateLimit, likeMessageController);
aiRouter.post('/messages/:id/regenerate', authMiddleware, aiRateLimit, regenerateMessageController);

// 语音识别进入 BullMQ 前先限流，避免大量音频文件和任务堆积。
aiRouter.post('/speech-to-text/jobs', authMiddleware, speechRateLimit, upload.single('audio'), createSpeechToTextJobController);
aiRouter.get('/speech-to-text/jobs/:id', authMiddleware, getSpeechToTextJobController);
