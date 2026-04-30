import { getConnectedRedisClient } from '../queues/redis.js';

function getRequestIp(req) {
  return req.ip || req.socket?.remoteAddress || 'anonymous';
}

function sanitizeKeySegment(value) {
  return String(value || 'anonymous')
    .replace(/[^a-zA-Z0-9:_-]/g, '_')
    .slice(0, 120);
}

export function userOrIpKey(req) {
  return req.user?.openid || getRequestIp(req);
}

export function createRateLimit({
  prefix,
  windowMs,
  max,
  keyGenerator = getRequestIp
}) {
  return async function rateLimitMiddleware(req, res, next) {
    try {
      const redis = await getConnectedRedisClient();
      const keyId = sanitizeKeySegment(keyGenerator(req));
      const windowId = Math.floor(Date.now() / windowMs);
      const key = `rate:${prefix}:${keyId}:${windowId}`;
      // 固定窗口限流：同一用户/IP 在同一时间窗口内递增同一个 Redis key。
      // Redis INCR 是原子操作，适合多 Node 进程共享限流计数。
      const count = await redis.incr(key);

      if (count === 1) {
        // 第一次写入时设置窗口过期时间，到期后 Redis 自动清理计数。
        await redis.pexpire(key, windowMs);
      }

      const remaining = Math.max(max - count, 0);
      res.setHeader('X-RateLimit-Limit', String(max));
      res.setHeader('X-RateLimit-Remaining', String(remaining));
      res.setHeader('X-RateLimit-Reset', String((windowId + 1) * windowMs));

      if (count > max) {
        return res.status(429).json({ msg: '请求过于频繁，请稍后再试' });
      }

      next();
    } catch (err) {
      // 限流是保护能力，不应该因为 Redis 短暂不可用导致核心接口全部失败。
      console.warn(`[rate-limit:${prefix}] Redis 不可用，已跳过限流: ${err.message}`);
      next();
    }
  };
}
