/*
 * @Description: 
 * @Author: wen.yao
 * @LastEditTime: 2025-12-05 16:47:22
 */
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ','');
  if(!token) return res.status(401).json({ msg:'未提供 token' });

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch(err) {
    res.status(401).json({ msg:'token 无效或已过期' });
  }
}
