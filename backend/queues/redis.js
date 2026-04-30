import Redis from 'ioredis';
import { config } from '../config.js';

let sharedClient = null;

function attachRedisErrorLogger(redis, label) {
  redis.on('error', (err) => {
    console.warn(`[redis:${label}] ${err.message}`);
  });
}

export function getRedisClient() {
  if (!sharedClient || sharedClient.status === 'end') {
    sharedClient = new Redis(config.redisUrl, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1
    });
    attachRedisErrorLogger(sharedClient, 'cache');
  }
  return sharedClient;
}

export async function getConnectedRedisClient() {
  const redis = getRedisClient();
  if (redis.status === 'ready') return redis;
  if (redis.status === 'wait' || redis.status === 'end') {
    await redis.connect();
  }
  return redis;
}

export function createQueueConnection(label = 'queue') {
  const redis = new Redis(config.redisUrl, {
    maxRetriesPerRequest: null
  });
  attachRedisErrorLogger(redis, label);
  return redis;
}
