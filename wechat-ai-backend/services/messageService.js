import axios from 'axios';
import { recognizeImage } from './ocrService.js';
import { AppError } from '../errors/AppError.js';

const DATA_URL_REGEX = /^data:image\/[a-zA-Z0-9.+-]+;base64,(.*)$/;
const HTTP_URL_REGEX = /^https?:\/\//i;

function isDataUrl(value) {
  return typeof value === 'string' && DATA_URL_REGEX.test(value);
}

function isHttpUrl(value) {
  return typeof value === 'string' && HTTP_URL_REGEX.test(value);
}

function isImageSource(value) {
  return isDataUrl(value) || isHttpUrl(value);
}

function bufferFromDataUrl(dataUrl) {
  const match = dataUrl.match(DATA_URL_REGEX);
  if (!match) return null;
  return Buffer.from(match[1], 'base64');
}

function bufferFromBase64(base64) {
  if (!base64) return null;
  const cleaned = base64.replace(/^data:image\/[^;]+;base64,/, '');
  return Buffer.from(cleaned, 'base64');
}

async function fetchImageBuffer(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data);
}

function buildDataUrl(base64, mimetype = 'image/png') {
  return `data:${mimetype};base64,${base64}`;
}

function normalizeBase64(value, mimetype) {
  if (!value) return null;
  const raw = String(value);
  if (raw.startsWith('data:image/')) return raw;
  return buildDataUrl(raw, mimetype);
}

function normalizeAudioBase64(value, mimetype = 'audio/wav') {
  if (!value) return null;
  const raw = String(value);
  if (raw.startsWith('data:audio/')) return raw;
  return `data:${mimetype};base64,${raw}`;
}

async function resolveImageBuffer(message, file, fileUsed) {
  const fileBuffer = file?.buffer || null;
  const fileMime = file?.mimetype || 'image/png';

  if (message.imageBase64) {
    const buffer = bufferFromBase64(message.imageBase64);
    if (buffer) {
      return {
        buffer,
        media: normalizeBase64(message.imageBase64, fileMime),
        usedFile: false
      };
    }
  }

  if (isDataUrl(message.content)) {
    const buffer = bufferFromDataUrl(message.content);
    if (buffer) return { buffer, media: message.content, usedFile: false };
  }

  if (message.imageUrl && isHttpUrl(message.imageUrl)) {
    const buffer = await fetchImageBuffer(message.imageUrl);
    return { buffer, media: message.imageUrl, usedFile: false };
  }

  if (isHttpUrl(message.content)) {
    const buffer = await fetchImageBuffer(message.content);
    return { buffer, media: message.content, usedFile: false };
  }

  if (fileBuffer && !fileUsed) {
    return {
      buffer: fileBuffer,
      media: buildDataUrl(fileBuffer.toString('base64'), fileMime),
      usedFile: true
    };
  }

  throw new AppError('图片消息缺少图片内容', 400);
}

export async function normalizeMessages(messages, options = {}) {
  if (!Array.isArray(messages)) {
    throw new AppError('messages格式不正确', 400);
  }

  const file = options.file || null;
  const defaultLang = options.lang || 'chi_sim';
  let fileUsed = false;

  const normalized = [];

  for (const message of messages) {
    const messageType = String(message?.type || '').toLowerCase();

    if (messageType === 'image') {
      const { buffer, media, usedFile } = await resolveImageBuffer(message, file, fileUsed);
      if (usedFile) fileUsed = true;

      const ocrLang = message.lang || defaultLang;
      const ocrText = await recognizeImage(buffer, ocrLang);
      if (!ocrText) {
        throw new AppError('图片未识别出文字', 400);
      }

      const prompt = message.prompt
        || (typeof message.content === 'string' && !isImageSource(message.content) ? message.content : '');
      const content = prompt ? `${prompt}\n\n${ocrText}` : ocrText;

      normalized.push({
        role: message.role || 'user',
        content,
        type: 'image',
        media
      });
      continue;
    }

    if (messageType === 'audio' || messageType === 'voice') {
      const media = message.media
        || (message.audioUrl && isHttpUrl(message.audioUrl) ? message.audioUrl : null)
        || normalizeAudioBase64(message.audioBase64);

      normalized.push({
        ...message,
        type: 'audio',
        media
      });
      continue;
    }

    normalized.push({
      ...message,
      type: messageType || 'text'
    });
  }

  return normalized;
}
