import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  chatController,
  chatMockController,
  getSessionsController,
  getSessionMessagesController,
  deleteSessionController,
  getModelsController,
  likeMessageController,
  regenerateMessageController,
  speechToTextController
} from '../controllers/aiController.js';

export const aiRouter = express.Router();

aiRouter.post('/chat', authMiddleware, upload.single('image'), chatController);
aiRouter.post('/chat-mock', authMiddleware, chatMockController);
aiRouter.get('/sessions', authMiddleware, getSessionsController);
aiRouter.get('/sessions/:id/messages', authMiddleware, getSessionMessagesController);
aiRouter.post('/sessions/:id/delete', authMiddleware, deleteSessionController);
aiRouter.get('/models', authMiddleware, getModelsController);
aiRouter.post('/messages/:id/like', authMiddleware, likeMessageController);
aiRouter.post('/messages/:id/regenerate', authMiddleware, regenerateMessageController);
aiRouter.post('/speech-to-text', authMiddleware, upload.single('audio'), speechToTextController);
