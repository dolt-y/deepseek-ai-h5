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
    // 普通 Redis 客户端用于限流等短命令。关闭离线队列，避免 Redis 断开时请求堆积。
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
  // BullMQ worker/queue 需要独立连接，maxRetriesPerRequest 必须为 null。
  const redis = new Redis(config.redisUrl, {
    maxRetriesPerRequest: null
  });
  attachRedisErrorLogger(redis, label);
  return redis;
}
