'use strict';

const Redis = require('ioredis');

// Fail fast when Redis is unavailable so cache outages fall back to the DB
// instead of holding requests through ioredis's default retry window.
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  lazyConnect: true,
  connectTimeout: 1000,
  maxRetriesPerRequest: 1,
  retryStrategy: (times) => Math.min(times * 100, 1000),
  enableOfflineQueue: false
});

// ioredis emits connection errors independently of command promise rejections.
// A listener prevents those expected outage events from becoming unhandled.
redis.on('error', () => {});

async function cacheGet(key) {
  try {
    const value = await redis.get(key);
    return value === null ? null : JSON.parse(value);
  } catch (err) {
    console.error('[cache] GET error:', err.message);
    return null;
  }
}

async function cacheSet(key, data, ttlSeconds) {
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch (err) {
    console.error('[cache] SET error:', err.message);
  }
}

async function cacheDel(key) {
  try {
    await redis.del(key);
  } catch (err) {
    console.error('[cache] DEL error:', err.message);
  }
}

module.exports = { cacheGet, cacheSet, cacheDel };

