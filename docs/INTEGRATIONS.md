# ContentBeagle - External Service Integrations

## Overview

ContentBeagle integrates with two external services:
- **Firecrawl**: Web crawling for brand discovery and cross-linking intelligence
- **DataForSEO**: SEO data for keyword opportunities and rankings

This document covers integration patterns, caching strategies, rate limiting, and cost optimization.

---

## Firecrawl Integration

### Use Cases

1. **Brand Discovery**: Crawl brand URLs to extract content for voice analysis
2. **Site Mapping**: Discover all pages on a website for cross-linking
3. **Page Summaries**: Generate summaries of crawled pages for link suggestions

### Client Wrapper

```typescript
// /src/lib/services/firecrawl/client.ts

import FirecrawlApp from '@mendable/firecrawl-js';

export interface FirecrawlConfig {
  apiKey: string;
}

export interface ScrapeOptions {
  formats?: ('markdown' | 'html' | 'rawHtml' | 'links' | 'screenshot')[];
  onlyMainContent?: boolean;
  waitFor?: number;
}

export interface CrawlOptions {
  limit?: number;
  scrapeOptions?: ScrapeOptions;
  excludePatterns?: string[];
  includePatterns?: string[];
}

export interface MapOptions {
  includeSubdomains?: boolean;
  limit?: number;
}

export class FirecrawlClient {
  private client: FirecrawlApp;

  constructor(config: FirecrawlConfig) {
    this.client = new FirecrawlApp({ apiKey: config.apiKey });
  }

  /**
   * Scrape a single page
   */
  async scrape(url: string, options: ScrapeOptions = {}) {
    const result = await this.client.scrapeUrl(url, {
      formats: options.formats || ['markdown'],
      onlyMainContent: options.onlyMainContent ?? true,
      waitFor: options.waitFor,
    });

    if (!result.success) {
      throw new Error(`Firecrawl scrape failed: ${result.error}`);
    }

    return {
      url: result.url,
      markdown: result.markdown,
      html: result.html,
      metadata: result.metadata,
    };
  }

  /**
   * Crawl multiple pages from a starting URL
   */
  async crawl(url: string, options: CrawlOptions = {}) {
    const result = await this.client.crawlUrl(url, {
      limit: options.limit || 50,
      scrapeOptions: {
        formats: options.scrapeOptions?.formats || ['markdown'],
        onlyMainContent: options.scrapeOptions?.onlyMainContent ?? true,
      },
      excludePatterns: options.excludePatterns,
      includePatterns: options.includePatterns,
    });

    if (!result.success) {
      throw new Error(`Firecrawl crawl failed: ${result.error}`);
    }

    return result.data.map(page => ({
      url: page.url,
      markdown: page.markdown,
      metadata: page.metadata,
    }));
  }

  /**
   * Map all URLs on a website (without scraping content)
   */
  async map(url: string, options: MapOptions = {}) {
    const result = await this.client.mapUrl(url, {
      includeSubdomains: options.includeSubdomains ?? false,
      limit: options.limit || 500,
    });

    if (!result.success) {
      throw new Error(`Firecrawl map failed: ${result.error}`);
    }

    return result.links;
  }

  /**
   * Batch scrape multiple URLs
   */
  async batchScrape(urls: string[], options: ScrapeOptions = {}) {
    const result = await this.client.batchScrapeUrls(urls, {
      formats: options.formats || ['markdown'],
      onlyMainContent: options.onlyMainContent ?? true,
    });

    if (!result.success) {
      throw new Error(`Firecrawl batch scrape failed: ${result.error}`);
    }

    return result.data.map(page => ({
      url: page.url,
      markdown: page.markdown,
      metadata: page.metadata,
    }));
  }
}
```

### Server Actions

```typescript
// /src/lib/services/firecrawl/actions.ts
'use server'

import { FirecrawlClient } from './client';
import { getTeamApiKey } from '@/lib/supabase/api-keys';
import { cache } from '@/lib/cache';

export async function scrapePage(teamId: string, url: string) {
  // Check cache first
  const cacheKey = `scrape:${url}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  // Get API key
  const apiKey = await getTeamApiKey(teamId, 'firecrawl');
  if (!apiKey) {
    throw new Error('Firecrawl API key not configured');
  }

  const client = new FirecrawlClient({ apiKey });
  const result = await client.scrape(url);

  // Cache for 24 hours
  await cache.set(cacheKey, result, { ttl: 86400 });

  // Track usage
  await trackCrawlUsage(teamId, 1);

  return result;
}

export async function crawlSite(
  teamId: string,
  brandId: string,
  url: string,
  maxPages: number = 50
) {
  const apiKey = await getTeamApiKey(teamId, 'firecrawl');
  if (!apiKey) {
    throw new Error('Firecrawl API key not configured');
  }

  // Create crawl job record
  const job = await createCrawlJob(brandId, [url], maxPages);

  const client = new FirecrawlClient({ apiKey });

  try {
    // Update job status
    await updateCrawlJobStatus(job.id, 'running');

    const results = await client.crawl(url, { limit: maxPages });

    // Store crawled pages
    for (const page of results) {
      await storeCrawledPage(brandId, job.id, page);
    }

    // Update job status
    await updateCrawlJobStatus(job.id, 'completed', results.length);

    // Track usage
    await trackCrawlUsage(teamId, results.length);

    return { jobId: job.id, pagesProcessed: results.length };
  } catch (error) {
    await updateCrawlJobStatus(job.id, 'failed', 0, error.message);
    throw error;
  }
}

export async function mapSiteUrls(teamId: string, url: string, limit: number = 500) {
  const apiKey = await getTeamApiKey(teamId, 'firecrawl');
  if (!apiKey) {
    throw new Error('Firecrawl API key not configured');
  }

  const client = new FirecrawlClient({ apiKey });
  const urls = await client.map(url, { limit });

  // Track usage (map counts as 1 credit per page discovered)
  await trackCrawlUsage(teamId, urls.length);

  return urls;
}
```

### Incremental Crawling

```typescript
// /src/lib/services/firecrawl/incremental-crawl.ts

export async function performIncrementalCrawl(
  teamId: string,
  brandId: string,
  baseUrl: string
) {
  // Get existing pages
  const existingPages = await db.crawledPage.findMany({
    where: { brandId },
    select: { url: true, contentHash: true, crawledAt: true },
  });

  const existingMap = new Map(existingPages.map(p => [p.url, p]));

  // Discover all URLs
  const discoveredUrls = await mapSiteUrls(teamId, baseUrl, 500);

  // Filter to pages needing re-crawl
  const urlsToProcess = discoveredUrls.filter(url => {
    const existing = existingMap.get(url);
    if (!existing) return true; // New page

    // Re-crawl if older than 7 days
    const age = Date.now() - existing.crawledAt.getTime();
    return age > 7 * 24 * 60 * 60 * 1000;
  });

  if (urlsToProcess.length === 0) {
    return { processed: 0, total: discoveredUrls.length };
  }

  // Batch scrape (limit to 50 at a time)
  const apiKey = await getTeamApiKey(teamId, 'firecrawl');
  const client = new FirecrawlClient({ apiKey });

  const batches = chunk(urlsToProcess, 50);
  let processed = 0;

  for (const batch of batches) {
    const results = await client.batchScrape(batch);

    for (const result of results) {
      const contentHash = hashContent(result.markdown);
      const existing = existingMap.get(result.url);

      // Only update if content changed
      if (!existing || existing.contentHash !== contentHash) {
        await upsertCrawledPage(brandId, {
          url: result.url,
          markdown: result.markdown,
          contentHash,
          metadata: result.metadata,
        });
      }
    }

    processed += results.length;
  }

  return { processed, total: discoveredUrls.length };
}
```

---

## DataForSEO Integration

### Use Cases

1. **Keyword Opportunities**: Find keywords to target for a given topic/domain
2. **Keyword Volume**: Get search volume data for specific keywords
3. **SERP Analysis**: Understand search result features for keywords

### Client Wrapper

```typescript
// /src/lib/services/dataforseo/client.ts

export interface DataForSEOConfig {
  login: string;
  password: string;
}

export interface KeywordData {
  keyword: string;
  searchVolume: number;
  cpc: number;
  competition: number;
  competitionLevel: 'low' | 'medium' | 'high';
  monthlySearches?: { year: number; month: number; searchVolume: number }[];
}

export interface RelatedKeyword extends KeywordData {
  relevance: number;
}

export class DataForSEOClient {
  private baseUrl = 'https://api.dataforseo.com/v3';
  private auth: string;

  constructor(config: DataForSEOConfig) {
    this.auth = Buffer.from(`${config.login}:${config.password}`).toString('base64');
  }

  private async request<T>(endpoint: string, body: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${this.auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`DataForSEO API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status_code !== 20000) {
      throw new Error(`DataForSEO error: ${data.status_message}`);
    }

    return data;
  }

  /**
   * Get search volume for keywords
   */
  async getKeywordVolume(
    keywords: string[],
    locationCode: number = 2840, // US
    languageCode: string = 'en'
  ): Promise<KeywordData[]> {
    const data = await this.request<any>(
      '/keywords_data/google_ads/search_volume/live',
      [{
        keywords,
        location_code: locationCode,
        language_code: languageCode,
      }]
    );

    return data.tasks[0].result.map((item: any) => ({
      keyword: item.keyword,
      searchVolume: item.search_volume,
      cpc: item.cpc,
      competition: item.competition,
      competitionLevel: item.competition_level,
      monthlySearches: item.monthly_searches,
    }));
  }

  /**
   * Get related keywords
   */
  async getRelatedKeywords(
    keyword: string,
    locationCode: number = 2840,
    languageCode: string = 'en',
    limit: number = 50
  ): Promise<RelatedKeyword[]> {
    const data = await this.request<any>(
      '/dataforseo_labs/google/related_keywords/live',
      [{
        keyword,
        location_code: locationCode,
        language_code: languageCode,
        limit,
      }]
    );

    return data.tasks[0].result[0].items.map((item: any) => ({
      keyword: item.keyword_data.keyword,
      searchVolume: item.keyword_data.keyword_info.search_volume,
      cpc: item.keyword_data.keyword_info.cpc,
      competition: item.keyword_data.keyword_info.competition,
      competitionLevel: item.keyword_data.keyword_info.competition_level,
      relevance: item.related_keyword_info.se_results_count,
    }));
  }

  /**
   * Get keyword suggestions for a domain
   */
  async getKeywordsForSite(
    domain: string,
    locationCode: number = 2840,
    languageCode: string = 'en',
    limit: number = 100
  ): Promise<KeywordData[]> {
    const data = await this.request<any>(
      '/dataforseo_labs/google/keywords_for_site/live',
      [{
        target: domain,
        location_code: locationCode,
        language_code: languageCode,
        limit,
      }]
    );

    return data.tasks[0].result[0].items.map((item: any) => ({
      keyword: item.keyword_data.keyword,
      searchVolume: item.keyword_data.keyword_info.search_volume,
      cpc: item.keyword_data.keyword_info.cpc,
      competition: item.keyword_data.keyword_info.competition,
      competitionLevel: item.keyword_data.keyword_info.competition_level,
    }));
  }

  /**
   * Get SERP overview for a keyword
   */
  async getSerpOverview(
    keyword: string,
    locationCode: number = 2840,
    languageCode: string = 'en'
  ): Promise<any> {
    const data = await this.request<any>(
      '/serp/google/organic/live/regular',
      [{
        keyword,
        location_code: locationCode,
        language_code: languageCode,
        depth: 10,
      }]
    );

    return data.tasks[0].result[0];
  }
}
```

### SEO Service

```typescript
// /src/lib/services/dataforseo/seo-service.ts

import { DataForSEOClient, KeywordData, RelatedKeyword } from './client';
import { cache } from '@/lib/cache';

export interface SEOEnrichment {
  primaryKeywords: KeywordData[];
  secondaryKeywords: KeywordData[];
  lsiKeywords: string[];
  searchIntent: 'informational' | 'navigational' | 'transactional' | 'commercial';
}

export class SEOService {
  private client: DataForSEOClient;

  constructor(login: string, password: string) {
    this.client = new DataForSEOClient({ login, password });
  }

  async getKeywordOpportunities(
    topic: string,
    domain?: string,
    existingKeywords?: string[]
  ): Promise<SEOEnrichment> {
    // Check cache
    const cacheKey = `seo:${topic}:${domain || 'nodomain'}`;
    const cached = await cache.get<SEOEnrichment>(cacheKey);
    if (cached) return cached;

    // Get related keywords for the topic
    const relatedKeywords = await this.client.getRelatedKeywords(topic, 2840, 'en', 50);

    // If domain provided, get domain-specific keywords
    let domainKeywords: KeywordData[] = [];
    if (domain) {
      domainKeywords = await this.client.getKeywordsForSite(domain, 2840, 'en', 50);
    }

    // Identify primary keywords (high volume, manageable competition)
    const primaryKeywords = this.identifyPrimaryKeywords(
      relatedKeywords,
      existingKeywords
    );

    // Identify secondary keywords (long-tail)
    const secondaryKeywords = this.identifySecondaryKeywords(
      relatedKeywords,
      primaryKeywords.map(k => k.keyword)
    );

    // Extract LSI keywords (related terms)
    const lsiKeywords = this.extractLSIKeywords(relatedKeywords);

    // Determine search intent
    const searchIntent = await this.analyzeSearchIntent(topic);

    const result: SEOEnrichment = {
      primaryKeywords,
      secondaryKeywords,
      lsiKeywords,
      searchIntent,
    };

    // Cache for 7 days
    await cache.set(cacheKey, result, { ttl: 7 * 24 * 60 * 60 });

    return result;
  }

  private identifyPrimaryKeywords(
    keywords: RelatedKeyword[],
    existingKeywords?: string[]
  ): KeywordData[] {
    return keywords
      .filter(k => {
        // Filter out existing keywords
        if (existingKeywords?.includes(k.keyword.toLowerCase())) return false;
        // High volume, manageable competition
        return k.searchVolume > 100 && k.competitionLevel !== 'high';
      })
      .sort((a, b) => {
        // Score by volume / competition
        const scoreA = a.searchVolume / (a.competition + 0.1);
        const scoreB = b.searchVolume / (b.competition + 0.1);
        return scoreB - scoreA;
      })
      .slice(0, 5);
  }

  private identifySecondaryKeywords(
    keywords: RelatedKeyword[],
    primaryKeywords: string[]
  ): KeywordData[] {
    return keywords
      .filter(k => {
        // Not already a primary keyword
        if (primaryKeywords.includes(k.keyword)) return false;
        // Lower volume, long-tail
        return k.searchVolume > 10 && k.searchVolume < 500;
      })
      .slice(0, 10);
  }

  private extractLSIKeywords(keywords: RelatedKeyword[]): string[] {
    // Extract unique single words from keyword phrases
    const words = new Set<string>();
    keywords.forEach(k => {
      k.keyword.split(' ').forEach(word => {
        if (word.length > 3) words.add(word.toLowerCase());
      });
    });
    return Array.from(words).slice(0, 20);
  }

  private async analyzeSearchIntent(
    topic: string
  ): Promise<'informational' | 'navigational' | 'transactional' | 'commercial'> {
    try {
      const serp = await this.client.getSerpOverview(topic);

      // Analyze SERP features
      let informational = 0;
      let transactional = 0;
      let commercial = 0;

      serp.items?.forEach((item: any) => {
        if (item.type === 'featured_snippet') informational += 2;
        if (item.type === 'people_also_ask') informational += 1;
        if (item.type === 'shopping') transactional += 2;
        if (item.type === 'local_pack') transactional += 1;
        if (item.type === 'product_considerations') commercial += 2;
      });

      if (transactional > informational && transactional > commercial) return 'transactional';
      if (commercial > informational) return 'commercial';
      return 'informational';
    } catch {
      return 'informational'; // Default
    }
  }
}
```

---

## Caching Strategy

### Cache Configuration

```typescript
// /src/lib/cache/index.ts

import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

interface CacheOptions {
  ttl?: number; // seconds
  tags?: string[];
}

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data as T | null;
  },

  async set(key: string, value: unknown, options: CacheOptions = {}) {
    const { ttl = 3600, tags = [] } = options;

    await redis.setex(key, ttl, JSON.stringify(value));

    // Track keys by tag for invalidation
    for (const tag of tags) {
      await redis.sadd(`cache:tag:${tag}`, key);
    }
  },

  async delete(key: string) {
    await redis.del(key);
  },

  async invalidateByTag(tag: string) {
    const keys = await redis.smembers(`cache:tag:${tag}`);
    if (keys.length > 0) {
      await redis.del(...keys);
      await redis.del(`cache:tag:${tag}`);
    }
  },
};
```

### Cache TTL by Data Type

| Data Type | TTL | Storage | Notes |
|-----------|-----|---------|-------|
| Page scrape | 24 hours | Redis | Re-fetch on demand |
| Site crawl results | 7 days | PostgreSQL | Incremental updates |
| Page summaries | 7 days | PostgreSQL | Update on re-crawl |
| Keyword volume | 30 days | Redis/PostgreSQL | Monthly update sufficient |
| Keyword opportunities | 7 days | Redis | Topic-specific |
| Brand voice profile | Indefinite | PostgreSQL | User-controlled updates |

---

## Rate Limiting

### Rate Limiter Configuration

```typescript
// /src/lib/services/rate-limiter.ts

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export const rateLimits = {
  firecrawl: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1s'), // 10 requests per second
    analytics: true,
  }),

  dataforseo: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '60s'), // 60 requests per minute
    analytics: true,
  }),
};

export async function checkRateLimit(
  service: 'firecrawl' | 'dataforseo',
  identifier: string
) {
  const limiter = rateLimits[service];
  const { success, remaining, reset } = await limiter.limit(identifier);

  if (!success) {
    throw new RateLimitError({
      service,
      remaining,
      resetAt: new Date(reset),
    });
  }

  return { remaining, resetAt: reset };
}

export class RateLimitError extends Error {
  constructor(public details: { service: string; remaining: number; resetAt: Date }) {
    super(`Rate limit exceeded for ${details.service}`);
  }
}
```

### Quota Management

```typescript
// /src/lib/services/quota.ts

export const quotaLimits = {
  firecrawl: {
    free: { daily: 50, monthly: 500 },
    pro: { daily: 500, monthly: 10000 },
    enterprise: { daily: 5000, monthly: 100000 },
  },
  dataforseo: {
    free: { daily: 50, monthly: 500 },
    pro: { daily: 500, monthly: 10000 },
    enterprise: { daily: 5000, monthly: 100000 },
  },
};

export async function checkQuota(
  teamId: string,
  service: 'firecrawl' | 'dataforseo',
  creditsNeeded: number = 1
) {
  const team = await getTeam(teamId);
  const limits = quotaLimits[service][team.plan];

  const usage = await getMonthlyUsage(teamId, service);

  if (usage.credits + creditsNeeded > limits.monthly) {
    throw new QuotaExceededError({
      service,
      used: usage.credits,
      limit: limits.monthly,
    });
  }

  return {
    used: usage.credits,
    limit: limits.monthly,
    remaining: limits.monthly - usage.credits,
  };
}
```

---

## Error Handling & Retries

```typescript
// /src/lib/services/retry.ts

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

const defaultConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay } = { ...defaultConfig, ...config };

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on non-retryable errors
      if (!isRetryableError(error)) {
        throw error;
      }

      if (attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      await sleep(delay);
    }
  }

  throw lastError!;
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Response) {
    // Retry on 429 (rate limit) and 5xx errors
    return error.status === 429 || error.status >= 500;
  }

  if (error instanceof Error) {
    // Retry on network errors
    return error.message.includes('ECONNRESET') ||
           error.message.includes('ETIMEDOUT') ||
           error.message.includes('network');
  }

  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## Cost Optimization

### Firecrawl Cost Estimates

| Operation | Credits |
|-----------|---------|
| Scrape (single page) | 1 |
| Crawl (per page) | 1 |
| Map (per URL discovered) | ~0.01 |
| Batch scrape (per page) | 1 |

### DataForSEO Cost Estimates

| Operation | Cost per Request |
|-----------|------------------|
| SERP Live | $0.002 |
| SERP Standard | $0.0006 |
| Keyword Volume | ~$0.0005 |
| Keywords for Site | ~$0.001 |
| Related Keywords | ~$0.001 |

### Optimization Strategies

1. **Use Map Before Crawl**: Map is cheaper than crawling. Discover URLs first, then selectively scrape.

2. **Batch Operations**: DataForSEO supports up to 700 keywords per request. Batch where possible.

3. **Aggressive Caching**: SEO data doesn't change rapidly. 7-30 day cache is appropriate.

4. **Prefer Standard over Live**: DataForSEO Standard endpoints are 3x cheaper than Live.

5. **Incremental Crawling**: Track content hashes. Only re-crawl changed pages.

```typescript
// Example: Smart crawl strategy
async function smartCrawl(teamId: string, brandId: string, url: string) {
  // Step 1: Map URLs (cheap)
  const allUrls = await mapSiteUrls(teamId, url, 500);

  // Step 2: Filter to relevant pages
  const relevantUrls = allUrls.filter(url =>
    !url.includes('/tag/') &&
    !url.includes('/author/') &&
    !url.includes('/page/') &&
    !url.includes('?')
  );

  // Step 3: Check what we already have
  const existing = await db.crawledPage.findMany({
    where: { brandId },
    select: { url: true },
  });
  const existingUrls = new Set(existing.map(p => p.url));

  // Step 4: Only scrape new pages
  const newUrls = relevantUrls.filter(url => !existingUrls.has(url));

  if (newUrls.length > 0) {
    await crawlSite(teamId, brandId, url, newUrls.length);
  }

  return { discovered: allUrls.length, new: newUrls.length };
}
```

---

## Usage Tracking

```typescript
// /src/lib/services/usage-tracking.ts

export async function trackCrawlUsage(teamId: string, pagesProcessed: number) {
  await db.crawlUsageLog.create({
    data: {
      teamId,
      pagesProcessed,
      creditsUsed: pagesProcessed,
      createdAt: new Date(),
    },
  });
}

export async function trackSeoUsage(
  teamId: string,
  operation: string,
  requestCount: number,
  estimatedCost: number
) {
  await db.seoUsageLog.create({
    data: {
      teamId,
      operation,
      requestCount,
      estimatedCost,
      createdAt: new Date(),
    },
  });
}

export async function getMonthlyUsage(teamId: string, service: 'firecrawl' | 'dataforseo') {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  if (service === 'firecrawl') {
    const result = await db.crawlUsageLog.aggregate({
      where: { teamId, createdAt: { gte: startOfMonth } },
      _sum: { creditsUsed: true },
    });
    return { credits: result._sum.creditsUsed || 0 };
  }

  const result = await db.seoUsageLog.aggregate({
    where: { teamId, createdAt: { gte: startOfMonth } },
    _sum: { requestCount: true, estimatedCost: true },
  });

  return {
    credits: result._sum.requestCount || 0,
    cost: result._sum.estimatedCost || 0,
  };
}
```
