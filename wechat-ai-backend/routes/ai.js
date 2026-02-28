import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { apiPaths } from '@ai-h5/shared';
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

aiRouter.post(apiPaths.ai.chat, authMiddleware, upload.single('image'), chatController);
aiRouter.post(apiPaths.ai.chatMock, authMiddleware, chatMockController);
aiRouter.get(apiPaths.ai.sessions, authMiddleware, getSessionsController);
aiRouter.get(apiPaths.ai.sessionMessages(':id'), authMiddleware, getSessionMessagesController);
aiRouter.post(apiPaths.ai.deleteSession(':id'), authMiddleware, deleteSessionController);
aiRouter.get(apiPaths.ai.models, authMiddleware, getModelsController);
aiRouter.post(apiPaths.ai.messageLike(':id'), authMiddleware, likeMessageController);
aiRouter.post(apiPaths.ai.messageRegenerate(':id'), authMiddleware, regenerateMessageController);
aiRouter.post(apiPaths.ai.speechToText, authMiddleware, upload.single('audio'), speechToTextController);
