import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const chatImageDir = path.resolve(__dirname, '../uploads/chat-images');

const memoryStorage = multer.memoryStorage();

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdir(chatImageDir, { recursive: true })
      .then(() => cb(null, chatImageDir))
      .catch((err) => cb(err));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.png';
    const safeExt = ext.replace(/[^.\w]/g, '') || '.png';
    const suffix = typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(16).slice(2);
    cb(null, `chat-${Date.now()}-${suffix}${safeExt}`);
  }
});

function imageFileFilter(req, file, cb) {
  if (file?.mimetype?.startsWith('image/')) {
    cb(null, true);
    return;
  }
  cb(new Error('仅支持图片文件上传'));
}

const upload = multer({ storage: memoryStorage });
const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// 暴露upload中间件供路由使用
export { upload, uploadImage };
