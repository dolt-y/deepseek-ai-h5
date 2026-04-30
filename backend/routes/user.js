import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createRateLimit } from '../middleware/rateLimit.js';
import { config } from '../config.js';
import {
  login,
  loginH5Controller,
  getInfo,
  refresh
} from '../controllers/userController.js';

export const userRouter = express.Router();
const loginRateLimit = createRateLimit({
  prefix: 'login',
  ...config.rateLimit.login
});

userRouter.post('/login', loginRateLimit, login);
userRouter.post('/login/h5', loginRateLimit, loginH5Controller);
userRouter.get('/info', authMiddleware, getInfo);
userRouter.post('/refresh', refresh);
