import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  login,
  loginH5Controller,
  getInfo,
  refresh
} from '../controllers/userController.js';
import { apiPaths } from '@ai-h5/shared';

export const userRouter = express.Router();

userRouter.post(apiPaths.user.login, login);
userRouter.post(apiPaths.user.loginH5, loginH5Controller);
userRouter.get(apiPaths.user.info, authMiddleware, getInfo);
userRouter.post(apiPaths.user.refresh, authMiddleware, refresh);
