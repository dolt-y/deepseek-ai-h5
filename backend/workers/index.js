import { speechWorker } from './speechWorker.js';
import { cleanupWorker } from './cleanupWorker.js';

async function shutdown() {
  await Promise.all([
    speechWorker.close(),
    cleanupWorker.close()
  ]);
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
