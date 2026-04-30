/*
 * @Description: 
 * @Author: wen.yao
 * @LastEditTime: 2025-12-05 16:47:22
 */
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

function getBearerToken(req) {
  return req.headers.authorization?.replace('Bearer ', '');
}

export function authMiddleware(req, res, next) {
  const token = getBearerToken(req);
  if(!token) return res.status(401).json({ msg:'未提供 token' });

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (!decoded?.openid) {
      return res.status(401).json({ msg: 'token 无效' });
    }
    // 业务接口只能使用短期 accessToken。旧版单 token 没有 type，作为过渡期 accessToken 处理。
    if (decoded?.type && decoded.type !== 'access') {
      return res.status(401).json({ msg: 'token 类型错误' });
    }
    req.user = decoded;
    next();
  } catch(err) {
    res.status(401).json({ msg:'token 无效或已过期' });
  }
}
