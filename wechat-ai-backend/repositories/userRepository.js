import { db, dbRun, dbGet } from '../db.js';

// 用户相关数据访问
export function upsertWeChatUser(openid, userInfo) {
  // 小程序登录：按 openid 插入或更新用户资料
  return dbRun(
    `
      INSERT INTO users(openid, nickname, avatarUrl, lastLogin)
      VALUES(?,?,?,datetime('now'))
      ON CONFLICT(openid) DO UPDATE SET
        nickname=excluded.nickname,
        avatarUrl=excluded.avatarUrl,
        lastLogin=datetime('now')
    `,
    [
      openid,
      userInfo?.nickName || '',
      userInfo?.avatarUrl || ''
    ]
  );
}

// 按 openid 查询用户（全字段）
export function getUserByOpenid(openid) {
  return dbGet(`SELECT * FROM users WHERE openid = ?`, [openid]);
}

// 按用户名查询登录信息（仅必要字段）
export function getUserByUsername(username) {
  return dbGet(
    `SELECT openid, username, passwordHash FROM users WHERE username = ?`,
    [username]
  );
}

// 创建 H5 账号用户
export function createH5User(openid, username, passwordHash, userInfo) {
  const nickname = userInfo?.nickName || username;
  const avatarUrl = userInfo?.avatarUrl || '';
  return dbRun(
    `
      INSERT INTO users(openid, username, passwordHash, nickname, avatarUrl, lastLogin)
      VALUES(?,?,?,?,?,datetime('now'))
    `,
    [openid, username, passwordHash, nickname, avatarUrl]
  );
}

// 仅更新最近登录时间
export function updateLastLogin(openid) {
  return dbRun(
    `UPDATE users SET lastLogin = datetime('now') WHERE openid = ?`,
    [openid]
  );
}

// 按需更新用户资料（不覆盖空值）
export function updateProfileIfProvided(openid, userInfo) {
  if (!userInfo?.nickName && !userInfo?.avatarUrl) {
    return Promise.resolve();
  }
  return dbRun(
    `UPDATE users
     SET nickname = COALESCE(?, nickname),
         avatarUrl = COALESCE(?, avatarUrl),
         lastLogin = datetime('now')
     WHERE openid = ?`,
    [
      userInfo?.nickName ?? null,
      userInfo?.avatarUrl ?? null,
      openid
    ]
  );
}
