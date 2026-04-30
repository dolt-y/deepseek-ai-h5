import { Worker } from 'bullmq';
import fs from 'fs/promises';
import { pathToFileURL } from 'url';
import { createQueueConnection } from '../queues/redis.js';
import { SPEECH_QUEUE_NAME } from '../queues/names.js';
import { transcribeSpeech } from '../services/speechService.js';

export const speechWorker = new Worker(
  SPEECH_QUEUE_NAME,
  async (job) => {
    if (job.name !== 'transcribe') {
      throw new Error(`Unsupported job: ${job.name}`);
    }

    const { filePath, language = 'zh' } = job.data;
    if (!filePath) {
      throw new Error('语音识别任务缺少 filePath');
    }

    await job.updateProgress(10);
    try {
      const text = await transcribeSpeech(filePath, language);
      await job.updateProgress(100);
      return { text };
    } finally {
      await fs.unlink(filePath).catch(() => {});
    }
  },
  {
    connection: createQueueConnection('speech-worker'),
    concurrency: Number(process.env.SPEECH_WORKER_CONCURRENCY || 1)
  }
);

speechWorker.on('completed', (job) => {
  console.log(`[speech-worker] job ${job.id} completed`);
});

speechWorker.on('failed', (job, err) => {
  console.error(`[speech-worker] job ${job?.id || 'unknown'} failed:`, err);
});

async function shutdown() {
  await speechWorker.close();
  process.exit(0);
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

console.log('[speech-worker] started');
