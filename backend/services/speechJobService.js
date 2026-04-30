import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { AppError } from '../errors/AppError.js';
import {
  addSpeechTranscriptionJob,
  getSpeechTranscriptionJob
} from '../queues/speechQueue.js';

const SPEECH_JOB_DIR = path.resolve('./temp/speech-jobs');
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
  const clean = String(ext)
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
  return clean || 'wav';
}

function buildTempAudioPath(mimetype) {
  const extension = normalizeExtension(MIME_EXTENSION_MAP[mimetype] || 'wav');
  const suffix =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(16).slice(2);
  return path.join(SPEECH_JOB_DIR, `speech-${Date.now()}-${suffix}.${extension}`);
}

export async function createSpeechToTextJob({
  buffer,
  mimetype,
  language = 'zh',
  openid,
  originalName
}) {
  if (!buffer || buffer.length === 0) {
    throw new AppError('未提供音频文件或文件为空', 400);
  }

  await fs.mkdir(SPEECH_JOB_DIR, { recursive: true });
  const filePath = buildTempAudioPath(mimetype);
  await fs.writeFile(filePath, buffer);

  try {
    const job = await addSpeechTranscriptionJob({
      filePath,
      mimetype,
      language,
      openid,
      originalName
    });
    return { jobId: job.id };
  } catch (err) {
    await fs.unlink(filePath).catch(() => {});
    throw err;
  }
}

export async function getSpeechToTextJob(jobId, openid) {
  const job = await getSpeechTranscriptionJob(jobId);
  if (!job) {
    throw new AppError('语音识别任务不存在', 404);
  }

  if (job.data?.openid !== openid) {
    throw new AppError('无权限查询此任务', 403);
  }

  const state = await job.getState();
  const response = {
    jobId: job.id,
    state,
    progress: job.progress || 0,
    createdAt: job.timestamp,
    processedAt: job.processedOn || null,
    finishedAt: job.finishedOn || null
  };

  if (state === 'completed') {
    response.text = job.returnvalue?.text || '';
  }

  if (state === 'failed') {
    response.failedReason = job.failedReason || '语音识别任务失败';
  }

  return response;
}
