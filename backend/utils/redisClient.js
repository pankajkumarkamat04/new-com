import { createClient } from 'redis';

let client = null;
let isReady = false;

const DEFAULT_REDIS_URL = process.env.REDIS_URL
  || (process.env.REDIS_HOST
    ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || '6379'}`
    : null);

async function getClient() {
  if (!DEFAULT_REDIS_URL) {
    return null;
  }

  if (client && isReady) {
    return client;
  }

  if (!client) {
    client = createClient({
      url: DEFAULT_REDIS_URL,
    });

    client.on('error', (err) => {
      console.error('Redis client error:', err?.message || err);
    });

    client.on('ready', () => {
      isReady = true;
      console.log('Redis client connected');
    });

    try {
      await client.connect();
    } catch (err) {
      console.error('Failed to connect to Redis, continuing without cache:', err?.message || err);
      client = null;
      isReady = false;
      return null;
    }
  }

  return isReady ? client : null;
}

export async function redisGetJson(key) {
  try {
    const c = await getClient();
    if (!c) return null;
    const value = await c.get(key);
    if (!value) return null;
    return JSON.parse(value);
  } catch (err) {
    console.error('Redis get error:', err?.message || err);
    return null;
  }
}

export async function redisSetJson(key, value, ttlSeconds) {
  try {
    const c = await getClient();
    if (!c) return;
    const payload = JSON.stringify(value);
    if (ttlSeconds && Number.isFinite(ttlSeconds)) {
      await c.set(key, payload, { EX: ttlSeconds });
    } else {
      await c.set(key, payload);
    }
  } catch (err) {
    console.error('Redis set error:', err?.message || err);
  }
}

export async function redisDel(key) {
  try {
    const c = await getClient();
    if (!c) return;
    await c.del(key);
  } catch (err) {
    console.error('Redis del error:', err?.message || err);
  }
}

export async function redisDeleteByPattern(pattern) {
  try {
    const c = await getClient();
    if (!c) return;
    const pat = pattern.endsWith('*') ? pattern : `${pattern}*`;
    const keys = await c.keys(pat);
    if (keys && keys.length > 0) {
      await c.del(keys);
    }
  } catch (err) {
    console.error('Redis delete-by-pattern error:', err?.message || err);
  }
}

export const PUBLIC_SETTINGS_CACHE_KEY = 'settings:public:v1';

