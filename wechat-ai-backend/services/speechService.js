import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { Whisper } from '../middleware/whisper.js';

const TEMP_DIR = path.resolve('./temp');
const WHISPER_ROOT = process.env.WHISPER_ROOT || path.resolve('./whisper.cpp');
const DEFAULT_AUDIO_PATH = process.env.WHISPER_SAMPLE_PATH || path.resolve('./sample-6s.wav');

const MIME_EXTENSION_MAP = {
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/mp4': 'm4a',
  'audio/aac': 'aac',
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/flac': 'flac'
};

function normalizeExtension(ext) {
  if (!ext) return 'wav';
  const clean = String(ext).replace(/[^a-z0-9]/gi, '').toLowerCase();
  return clean || 'wav';
}

export async function transcribeSpeech(filePath, language = 'zh') {
  await fs.mkdir(TEMP_DIR, { recursive: true });
  const targetPath = filePath || DEFAULT_AUDIO_PATH;
  const whisper = new Whisper(WHISPER_ROOT, 'ggml-tiny.bin');
  return whisper.transcribe(targetPath, language);
}

export async function transcribeSpeechBuffer(buffer, mimetype, language = 'zh') {
  if (!buffer || buffer.length === 0) {
    throw new Error('未提供音频内容');
  }

  await fs.mkdir(TEMP_DIR, { recursive: true });
  const extension = normalizeExtension(MIME_EXTENSION_MAP[mimetype] || 'wav');
  const suffix = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(16).slice(2);
  const tempFilePath = path.join(TEMP_DIR, `upload-${Date.now()}-${suffix}.${extension}`);

  await fs.writeFile(tempFilePath, buffer);
  try {
    return await transcribeSpeech(tempFilePath, language);
  } finally {
    await fs.unlink(tempFilePath).catch(() => {});
  }
}
