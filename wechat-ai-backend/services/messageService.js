import { AppError } from '../errors/AppError.js';

export async function normalizeMessages(messages, options = {}) {
  if (!Array.isArray(messages)) {
    throw new AppError('messages格式不正确', 400);
  }

  const file = options.file || null;

  const normalized = [];

  for (const message of messages) {
    const messageType = String(message?.type || '').toLowerCase();

    if (messageType === 'image') {
      if (!file?.path || !file?.filename) {
        throw new AppError('图片消息请使用 multipart 上传 image 文件', 400);
      }

      const prompt =
        message.prompt ||
        (typeof message.content === 'string' ? message.content : '');
      // 仅保存图片与可选文案，不再进行 OCR。
      const content = prompt || '用户上传了一张图片';
      const media = `/uploads/chat-images/${file.filename}`;

      normalized.push({
        role: message.role || 'user',
        content,
        type: 'image',
        media,
      });
      continue;
    }

    if (messageType === 'audio' || messageType === 'voice') {
      normalized.push({
        ...message,
        type: 'audio',
        media: message.media || message.audioUrl || null,
      });
      continue;
    }

    normalized.push({
      ...message,
      type: messageType || 'text',
    });
  }

  return normalized;
}
