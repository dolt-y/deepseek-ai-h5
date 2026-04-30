import { Queue } from 'bullmq';
import { config } from '../config.js';
import { createQueueConnection } from './redis.js';

// 队列层统一管理 BullMQ 队列名称、默认重试策略和任务投递方法。
// 业务服务只需要调用 add/get/schedule，不直接关心 BullMQ 的连接和保留策略。
export const SPEECH_QUEUE_NAME = 'speech-transcription';
export const CLEANUP_QUEUE_NAME = 'generated-file-cleanup';

let speechQueue = null;
let cleanupQueue = null;

function buildQueue(name, label, defaultJobOptions) {
  return new Queue(name, {
    connection: createQueueConnection(label),
    defaultJobOptions
  });
}

export function getSpeechQueue() {
  if (!speechQueue) {
    speechQueue = buildQueue(SPEECH_QUEUE_NAME, 'speech-queue', {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 3000
      },
      removeOnComplete: {
        age: 24 * 60 * 60,
        count: 200
      },
      removeOnFail: {
        age: 7 * 24 * 60 * 60,
        count: 500
      }
    });
  }
  return speechQueue;
}

export function getCleanupQueue() {
  if (!cleanupQueue) {
    cleanupQueue = buildQueue(CLEANUP_QUEUE_NAME, 'cleanup-queue', {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      removeOnComplete: {
        age: 24 * 60 * 60,
        count: 50
      },
      removeOnFail: {
        age: 7 * 24 * 60 * 60,
        count: 100
      }
    });
  }
  return cleanupQueue;
}

export async function addSpeechTranscriptionJob(data) {
  return getSpeechQueue().add('transcribe', data);
}

export async function getSpeechTranscriptionJob(jobId) {
  return getSpeechQueue().getJob(jobId);
}

export async function scheduleCleanupUploadsJob() {
  return getCleanupQueue().add(
    'cleanup-generated-files',
    {},
    {
      jobId: 'cleanup-generated-files',
      repeat: {
        every: config.jobs.cleanup.everyMs
      }
    }
  );
}
