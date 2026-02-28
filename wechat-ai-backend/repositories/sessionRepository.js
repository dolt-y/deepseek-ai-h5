import { dbRun, dbAll, dbGet } from '../db.js';
import { getLocalTimeString } from '../utils/time.js';

// 会话相关数据访问
export function createSession(openid, title = '新会话') {
  // 创建会话并返回新 ID
  const now = getLocalTimeString();
  return dbRun(
    `INSERT INTO sessions (openid, title, created_at, updated_at) VALUES (?, ?, ?, ?)`,
    [openid, title, now, now]
  ).then(result => result.lastID);
}

// 按用户查询会话列表
export function listSessionsByOpenid(openid) {
  return dbAll(
    `SELECT id, title, updated_at FROM sessions WHERE openid = ? ORDER BY updated_at DESC`,
    [openid]
  );
}

// 校验会话归属（按会话 ID + openid）
export function getSessionByIdAndOpenid(sessionId, openid) {
  return dbGet(
    `SELECT id FROM sessions WHERE id = ? AND openid = ?`,
    [sessionId, openid]
  );
}

// 删除会话
export function deleteSession(sessionId) {
  return dbRun(`DELETE FROM sessions WHERE id = ?`, [sessionId]);
}
