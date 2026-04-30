import { Worker } from 'bullmq';
import { pathToFileURL } from 'url';
import { createQueueConnection } from '../queues/redis.js';
import { CLEANUP_QUEUE_NAME } from '../queues/names.js';
import { scheduleCleanupUploadsJob } from '../queues/cleanupQueue.js';
import { cleanupGeneratedFiles } from '../jobs/cleanupUploadsJob.js';

export const cleanupWorker = new Worker(
  CLEANUP_QUEUE_NAME,
  async (job) => {
    if (job.name !== 'cleanup-generated-files') {
      throw new Error(`Unsupported job: ${job.name}`);
    }
    return cleanupGeneratedFiles();
  },
  {
    connection: createQueueConnection('cleanup-worker'),
    concurrency: 1
  }
);

cleanupWorker.on('completed', (job, result) => {
  console.log(`[cleanup-worker] job ${job.id} completed`, result);
});

cleanupWorker.on('failed', (job, err) => {
  console.error(`[cleanup-worker] job ${job?.id || 'unknown'} failed:`, err);
});

await scheduleCleanupUploadsJob()
  .then(() => {
    console.log('[cleanup-worker] repeatable cleanup job scheduled');
  })
  .catch((err) => {
    console.error('[cleanup-worker] schedule failed:', err);
  });

async function shutdown() {
  await cleanupWorker.close();
  process.exit(0);
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

console.log('[cleanup-worker] started');
