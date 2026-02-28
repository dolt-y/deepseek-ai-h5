import sqlite3 from 'sqlite3';
import { config } from './config.js';

export const db = new sqlite3.Database(config.dbFile, (err) => {
  if (err) console.error(err.message);
  else console.log('Connected to SQLite3 database.');
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      openid TEXT PRIMARY KEY,
      username TEXT,
      passwordHash TEXT,
      nickname TEXT,
      avatarUrl TEXT,
      model TEXT DEFAULT 'deepseek-chat',
      lastLogin TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      openid TEXT,
      title TEXT,
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY(openid) REFERENCES users(openid)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS chat_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER,
      role TEXT,
      content TEXT,
      type TEXT DEFAULT 'text',
      media TEXT,
      reasoning_content TEXT,
      created_at TEXT,
      liked INTEGER DEFAULT 0,
      FOREIGN KEY(session_id) REFERENCES sessions(id)
    )
  `);

  const safeAlter = (sql) => {
    db.run(sql, (err) => {
      if (err && !/duplicate column name/i.test(err.message)) {
        console.error(err.message);
      }
    });
  };

  safeAlter(`ALTER TABLE users ADD COLUMN username TEXT`);
  safeAlter(`ALTER TABLE users ADD COLUMN passwordHash TEXT`);
  db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)`);

  safeAlter(`ALTER TABLE chat_records ADD COLUMN type TEXT DEFAULT 'text'`);
  safeAlter(`ALTER TABLE chat_records ADD COLUMN media TEXT`);
});
// 数据库操作 Promise 化
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}
export { dbRun, dbGet, dbAll };
