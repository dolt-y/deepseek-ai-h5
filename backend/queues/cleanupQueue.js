import { Queue } from 'bullmq';
import { config } from '../config.js';
import { createQueueConnection } from './redis.js';
import { CLEANUP_QUEUE_NAME } from './names.js';

let cleanupQueue = null;

export function getCleanupQueue() {
  if (!cleanupQueue) {
    cleanupQueue = new Queue(CLEANUP_QUEUE_NAME, {
      connection: createQueueConnection('cleanup-queue'),
      defaultJobOptions: {
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
      }
    });
  }
  return cleanupQueue;
}

export async function scheduleCleanupUploadsJob() {
  const queue = getCleanupQueue();
  return queue.add(
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
