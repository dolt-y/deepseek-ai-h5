import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  login,
  loginH5Controller,
  getInfo,
  refresh
} from '../controllers/userController.js';

export const userRouter = express.Router();

userRouter.post('/login', login);
userRouter.post('/login/h5', loginH5Controller);
userRouter.get('/info', authMiddleware, getInfo);
userRouter.post('/refresh', authMiddleware, refresh);
