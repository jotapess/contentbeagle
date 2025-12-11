/**
 * Redis Cache Client
 *
 * Upstash Redis client for caching crawled pages, API responses,
 * and preventing duplicate operations.
 */

import { Redis } from '@upstash/redis';

// Singleton Redis client
let redis: Redis | null = null;

/**
 * Get Redis client instance
 * Returns null if not configured (allows graceful degradation)
 */
export function getRedisClient(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('Redis not configured - caching disabled');
    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}

/**
 * Cache key prefixes for different data types
 */
export const CachePrefix = {
  CRAWL_PAGE: 'crawl:page:',      // Cached crawled page content
  CRAWL_JOB: 'crawl:job:',        // Crawl job status
  URL_MAP: 'crawl:map:',          // URL mapping results
  KEYWORD: 'seo:keyword:',        // Keyword research data
  RATE_LIMIT: 'rate:',            // Rate limiting counters
} as const;

/**
 * Default TTLs in seconds
 */
export const CacheTTL = {
  CRAWL_PAGE: 24 * 60 * 60,       // 24 hours for crawled pages
  CRAWL_JOB: 7 * 24 * 60 * 60,    // 7 days for job status
  URL_MAP: 7 * 24 * 60 * 60,      // 7 days for URL maps
  KEYWORD: 30 * 24 * 60 * 60,     // 30 days for keyword data
  RATE_LIMIT: 60,                  // 1 minute for rate limits
} as const;

/**
 * Generic cache get with type safety
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const data = await client.get<T>(key);
    return data;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

/**
 * Generic cache set with TTL
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds?: number
): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    if (ttlSeconds) {
      await client.set(key, value, { ex: ttlSeconds });
    } else {
      await client.set(key, value);
    }
    return true;
  } catch (error) {
    console.error('Redis set error:', error);
    return false;
  }
}

/**
 * Delete a cache key
 */
export async function cacheDelete(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.del(key);
    return true;
  } catch (error) {
    console.error('Redis delete error:', error);
    return false;
  }
}

/**
 * Check if key exists
 */
export async function cacheExists(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    const exists = await client.exists(key);
    return exists === 1;
  } catch (error) {
    console.error('Redis exists error:', error);
    return false;
  }
}

/**
 * Increment a counter (for rate limiting)
 */
export async function cacheIncrement(
  key: string,
  ttlSeconds?: number
): Promise<number> {
  const client = getRedisClient();
  if (!client) return 0;

  try {
    const count = await client.incr(key);
    if (ttlSeconds && count === 1) {
      await client.expire(key, ttlSeconds);
    }
    return count;
  } catch (error) {
    console.error('Redis incr error:', error);
    return 0;
  }
}

/**
 * Get multiple keys at once
 */
export async function cacheGetMany<T>(keys: string[]): Promise<(T | null)[]> {
  const client = getRedisClient();
  if (!client) return keys.map(() => null);

  try {
    const results = await client.mget<T[]>(...keys);
    return results;
  } catch (error) {
    console.error('Redis mget error:', error);
    return keys.map(() => null);
  }
}

/**
 * Delete multiple keys by pattern
 */
export async function cacheDeletePattern(pattern: string): Promise<number> {
  const client = getRedisClient();
  if (!client) return 0;

  try {
    // Scan for keys matching pattern
    let cursor = 0;
    let deletedCount = 0;

    do {
      const [nextCursor, keys] = await client.scan(cursor, {
        match: pattern,
        count: 100,
      });
      cursor = Number(nextCursor);

      if (keys.length > 0) {
        await client.del(...keys);
        deletedCount += keys.length;
      }
    } while (cursor !== 0);

    return deletedCount;
  } catch (error) {
    console.error('Redis delete pattern error:', error);
    return 0;
  }
}

// ============================================
// Crawl-specific cache helpers
// ============================================

/**
 * Cache a crawled page
 */
export async function cacheCrawledPage(
  url: string,
  data: {
    markdown: string;
    title?: string;
    description?: string;
    crawledAt: string;
  }
): Promise<boolean> {
  const key = `${CachePrefix.CRAWL_PAGE}${encodeURIComponent(url)}`;
  return cacheSet(key, data, CacheTTL.CRAWL_PAGE);
}

/**
 * Get cached crawled page
 */
export async function getCachedCrawledPage(url: string): Promise<{
  markdown: string;
  title?: string;
  description?: string;
  crawledAt: string;
} | null> {
  const key = `${CachePrefix.CRAWL_PAGE}${encodeURIComponent(url)}`;
  return cacheGet(key);
}

/**
 * Check if URL was recently crawled
 */
export async function isUrlRecentlyCrawled(url: string): Promise<boolean> {
  const key = `${CachePrefix.CRAWL_PAGE}${encodeURIComponent(url)}`;
  return cacheExists(key);
}

/**
 * Cache URL map results for a domain
 */
export async function cacheUrlMap(
  domain: string,
  urls: string[]
): Promise<boolean> {
  const key = `${CachePrefix.URL_MAP}${domain}`;
  return cacheSet(key, urls, CacheTTL.URL_MAP);
}

/**
 * Get cached URL map for a domain
 */
export async function getCachedUrlMap(domain: string): Promise<string[] | null> {
  const key = `${CachePrefix.URL_MAP}${domain}`;
  return cacheGet(key);
}

// ============================================
// Rate limiting helpers
// ============================================

/**
 * Check rate limit for a specific action
 * Returns true if within limit, false if exceeded
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const key = `${CachePrefix.RATE_LIMIT}${identifier}`;
  const client = getRedisClient();

  if (!client) {
    // If no Redis, allow all requests
    return { allowed: true, remaining: maxRequests, resetIn: 0 };
  }

  try {
    const count = await cacheIncrement(key, windowSeconds);
    const allowed = count <= maxRequests;
    const remaining = Math.max(0, maxRequests - count);

    // Get TTL for reset time
    const ttl = await client.ttl(key);
    const resetIn = ttl > 0 ? ttl : windowSeconds;

    return { allowed, remaining, resetIn };
  } catch (error) {
    console.error('Rate limit check error:', error);
    return { allowed: true, remaining: maxRequests, resetIn: 0 };
  }
}
