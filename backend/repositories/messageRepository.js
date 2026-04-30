import { dbRun, dbAll, dbGet } from '../db.js';
import { getLocalTimeString } from '../utils/time.js';

// 消息相关数据访问
export function insertMessage(sessionId, role, content, reasoningContent = null, type = 'text', media = null) {
  // 新增聊天记录（支持 type/media）
  const now = getLocalTimeString();
  return dbRun(
    `INSERT INTO chat_records(session_id, role, content, type, media, reasoning_content, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      sessionId,
      role,
      content,
      type,
      media,
      reasoningContent,
      now
    ]
  );
}

// 更新消息内容（用于重新生成）
export function updateMessage(messageId, content, reasoningContent = null) {
  const now = getLocalTimeString();
  return dbRun(
    `UPDATE chat_records SET content = ?, reasoning_content = ?, created_at = ? WHERE id = ?`,
    [content, reasoningContent, now, messageId]
  );
}

// 获取会话历史（可选截止时间）
export function getSessionHistory(sessionId, beforeTime = null) {
  if (beforeTime) {
    return dbAll(
      `SELECT role, content FROM chat_records 
       WHERE session_id = ? AND created_at < ?
       ORDER BY created_at ASC`,
      [sessionId, beforeTime]
    );
  }
  return dbAll(
    `SELECT role, content FROM chat_records WHERE session_id = ? ORDER BY created_at ASC`,
    [sessionId]
  );
}

// 获取会话消息列表
export function getSessionMessages(sessionId) {
  return dbAll(
    `SELECT id, role, content, type, media, reasoning_content , created_at, liked FROM chat_records WHERE session_id = ? ORDER BY created_at ASC`,
    [sessionId]
  );
}

// 删除会话内所有消息
export function deleteMessagesBySession(sessionId) {
  return dbRun(`DELETE FROM chat_records WHERE session_id = ?`, [sessionId]);
}

// 获取点赞状态
export function getMessageLikeStatus(messageId) {
  return dbGet(
    `SELECT id, liked FROM chat_records WHERE id = ?`,
    [messageId]
  );
}

// 获取消息内容（用于 mock）
export function getMessageContentById(messageId) {
  return dbGet(
    `SELECT content FROM chat_records WHERE id = ?`,
    [messageId]
  );
}

// 更新点赞状态
export function setMessageLikeStatus(messageId, liked) {
  return dbRun(
    `UPDATE chat_records SET liked = ? WHERE id = ?`,
    [liked, messageId]
  );
}

// 获取消息与会话归属信息（权限校验）
export function getMessageWithSessionOwner(messageId) {
  return dbGet(
    `SELECT cr.id, cr.session_id, cr.created_at, cr.role, s.openid
     FROM chat_records cr
     JOIN sessions s ON cr.session_id = s.id
     WHERE cr.id = ?`,
    [messageId]
  );
}
