import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { AppError } from '../errors/AppError.js';
import {
  addSpeechTranscriptionJob,
  getSpeechTranscriptionJob
} from '../queues/index.js';

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

// 业务入口：HTTP 请求只负责接收音频并创建任务。
// 真正耗时的 Whisper 转写由 speechWorker 在后台执行，避免接口长时间阻塞。
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
    // 队列任务里只保存文件路径和必要元数据，避免把大音频内容写进 Redis。
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

// 查询接口只允许任务创建者读取结果，防止通过 jobId 枚举他人语音内容。
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
