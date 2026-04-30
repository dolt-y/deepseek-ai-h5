import { Queue } from 'bullmq';
import { createQueueConnection } from './redis.js';
import { SPEECH_QUEUE_NAME } from './names.js';

let speechQueue = null;

function getSpeechQueue() {
  if (!speechQueue) {
    speechQueue = new Queue(SPEECH_QUEUE_NAME, {
      connection: createQueueConnection('speech-queue'),
      defaultJobOptions: {
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
      }
    });
  }
  return speechQueue;
}

export async function addSpeechTranscriptionJob(data) {
  return getSpeechQueue().add('transcribe', data);
}

export async function getSpeechTranscriptionJob(jobId) {
  return getSpeechQueue().getJob(jobId);
}
