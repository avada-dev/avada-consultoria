import { createClient } from 'redis';
import crypto from 'crypto-js';

let redisClient: ReturnType<typeof createClient> | null = null;

/**
 * Initialize Redis client
 * Falls back gracefully if Redis is not available
 */
export async function getRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.warn('[Cache] REDIS_URL not configured, cache disabled');
    return null;
  }

  try {
    redisClient = createClient({
      url: redisUrl,
    });

    redisClient.on('error', (err) => {
      console.error('[Cache] Redis error:', err);
    });

    await redisClient.connect();
    console.log('[Cache] Redis connected successfully');
    
    return redisClient;
  } catch (error) {
    console.error('[Cache] Failed to connect to Redis:', error);
    redisClient = null;
    return null;
  }
}

/**
 * Generate a unique hash for cache key based on search parameters
 */
export function generateCacheKey(params: {
  matricula: string;
  cidade: string;
  estado: string;
  orgao?: string;
  cargo?: string;
}): string {
  const normalized = {
    matricula: params.matricula.trim().toLowerCase(),
    cidade: params.cidade.trim().toLowerCase(),
    estado: params.estado.trim().toUpperCase(),
    orgao: params.orgao?.trim().toLowerCase() || '',
    cargo: params.cargo?.trim().toLowerCase() || '',
  };

  const keyString = JSON.stringify(normalized);
  const hash = crypto.SHA256(keyString).toString();
  
  return `osint:search:${hash}`;
}

/**
 * Get cached search results
 */
export async function getCachedResults(cacheKey: string): Promise<any | null> {
  const client = await getRedisClient();
  
  if (!client) {
    return null;
  }

  try {
    const cached = await client.get(cacheKey);
    
    if (cached) {
      console.log('[Cache] Cache HIT:', cacheKey);
      return JSON.parse(cached);
    }
    
    console.log('[Cache] Cache MISS:', cacheKey);
    return null;
  } catch (error) {
    console.error('[Cache] Error reading from cache:', error);
    return null;
  }
}

/**
 * Store search results in cache with TTL (24 hours)
 */
export async function setCachedResults(cacheKey: string, data: any, ttlSeconds: number = 86400): Promise<void> {
  const client = await getRedisClient();
  
  if (!client) {
    return;
  }

  try {
    await client.setEx(cacheKey, ttlSeconds, JSON.stringify(data));
    console.log('[Cache] Cached results for:', cacheKey);
  } catch (error) {
    console.error('[Cache] Error writing to cache:', error);
  }
}

/**
 * Clear all cache (admin function)
 */
export async function clearCache(): Promise<void> {
  const client = await getRedisClient();
  
  if (!client) {
    return;
  }

  try {
    await client.flushDb();
    console.log('[Cache] Cache cleared');
  } catch (error) {
    console.error('[Cache] Error clearing cache:', error);
  }
}
