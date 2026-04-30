import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createRateLimit, userOrIpKey } from '../middleware/rateLimit.js';
import { upload, uploadImage } from '../middleware/upload.js';
import { config } from '../config.js';
import {
  chatController,
  chatMockController,
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

aiRouter.post('/chat', authMiddleware, aiRateLimit, uploadImage.single('image'), chatController);
aiRouter.post('/chat-mock', authMiddleware, aiRateLimit, chatMockController);
aiRouter.get('/sessions', authMiddleware, getSessionsController);
aiRouter.get('/sessions/:id/messages', authMiddleware, getSessionMessagesController);
aiRouter.post('/sessions/:id/delete', authMiddleware, deleteSessionController);
aiRouter.get('/models', authMiddleware, getModelsController);
aiRouter.post('/messages/:id/like', authMiddleware, aiRateLimit, likeMessageController);
aiRouter.post('/messages/:id/regenerate', authMiddleware, aiRateLimit, regenerateMessageController);
aiRouter.post('/speech-to-text/jobs', authMiddleware, speechRateLimit, upload.single('audio'), createSpeechToTextJobController);
aiRouter.get('/speech-to-text/jobs/:id', authMiddleware, getSpeechToTextJobController);
