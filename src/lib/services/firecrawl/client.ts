/**
 * Firecrawl Client Wrapper
 *
 * Provides a unified interface for web scraping and crawling
 * with caching, rate limiting, and error handling.
 *
 * Uses Firecrawl SDK v2 API
 */

import Firecrawl from '@mendable/firecrawl-js';
import {
  cacheCrawledPage,
  getCachedCrawledPage,
  cacheUrlMap,
  getCachedUrlMap,
  checkRateLimit,
} from '@/lib/cache/redis';

// Types for our wrapper responses
export interface ScrapeResult {
  success: boolean;
  url: string;
  markdown?: string;
  html?: string;
  title?: string;
  description?: string;
  error?: string;
  cached?: boolean;
}

export interface MapResult {
  success: boolean;
  urls: string[];
  error?: string;
  cached?: boolean;
}

export interface CrawlJobResult {
  success: boolean;
  jobId?: string;
  status?: string;
  error?: string;
}

export interface CrawlStatusResult {
  success: boolean;
  status: 'pending' | 'scraping' | 'completed' | 'failed';
  progress?: number;
  total?: number;
  data?: ScrapeResult[];
  error?: string;
}

export interface CrawlOptions {
  maxPages?: number;
  maxDepth?: number;
  includePaths?: string[];
  excludePaths?: string[];
  webhookUrl?: string;
  webhookMetadata?: Record<string, string>;
}

// Singleton client
let firecrawlClient: Firecrawl | null = null;

/**
 * Get Firecrawl client instance (v2)
 */
export function getFirecrawlClient(): Firecrawl | null {
  if (firecrawlClient) return firecrawlClient;

  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    console.warn('Firecrawl API key not configured');
    return null;
  }

  firecrawlClient = new Firecrawl({ apiKey });
  return firecrawlClient;
}

/**
 * Check if Firecrawl is configured
 */
export function isFirecrawlConfigured(): boolean {
  return !!process.env.FIRECRAWL_API_KEY;
}

/**
 * Scrape a single URL using v2 API
 * Returns cached result if available
 */
export async function scrapeUrl(
  url: string,
  options: {
    formats?: ('markdown' | 'html')[];
    useCache?: boolean;
    teamId?: string;
  } = {}
): Promise<ScrapeResult> {
  const { formats = ['markdown'], useCache = true, teamId } = options;

  // Check cache first
  if (useCache) {
    const cached = await getCachedCrawledPage(url);
    if (cached) {
      return {
        success: true,
        url,
        markdown: cached.markdown,
        title: cached.title,
        description: cached.description,
        cached: true,
      };
    }
  }

  // Rate limit check (10 requests per minute per team)
  if (teamId) {
    const { allowed, remaining, resetIn } = await checkRateLimit(
      `firecrawl:scrape:${teamId}`,
      10,
      60
    );
    if (!allowed) {
      return {
        success: false,
        url,
        error: `Rate limit exceeded. Try again in ${resetIn} seconds. (${remaining} remaining)`,
      };
    }
  }

  const client = getFirecrawlClient();
  if (!client) {
    return {
      success: false,
      url,
      error: 'Firecrawl not configured',
    };
  }

  try {
    // v2 API uses `scrape` method
    const result = await client.scrape(url, {
      formats,
      timeout: 30000,
    });

    const scrapeResult: ScrapeResult = {
      success: true,
      url,
      markdown: result.markdown,
      html: result.html,
      title: result.metadata?.title,
      description: result.metadata?.description,
    };

    // Cache successful result
    if (useCache && scrapeResult.markdown) {
      await cacheCrawledPage(url, {
        markdown: scrapeResult.markdown,
        title: scrapeResult.title,
        description: scrapeResult.description,
        crawledAt: new Date().toISOString(),
      });
    }

    return scrapeResult;
  } catch (error) {
    console.error('Firecrawl scrape error:', error);
    return {
      success: false,
      url,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Discover URLs on a domain using Firecrawl's map endpoint (v2 API)
 */
export async function mapDomain(
  domain: string,
  options: {
    limit?: number;
    includeSubdomains?: boolean;
    useCache?: boolean;
    teamId?: string;
  } = {}
): Promise<MapResult> {
  const { limit = 100, includeSubdomains = false, useCache = true, teamId } = options;

  // Normalize domain URL
  const normalizedUrl = domain.startsWith('http')
    ? domain
    : `https://${domain}`;

  // Extract domain for caching
  const domainKey = new URL(normalizedUrl).hostname;

  // Check cache first
  if (useCache) {
    const cached = await getCachedUrlMap(domainKey);
    if (cached) {
      return {
        success: true,
        urls: cached,
        cached: true,
      };
    }
  }

  // Rate limit check (5 map requests per minute per team)
  if (teamId) {
    const { allowed, remaining, resetIn } = await checkRateLimit(
      `firecrawl:map:${teamId}`,
      5,
      60
    );
    if (!allowed) {
      return {
        success: false,
        urls: [],
        error: `Rate limit exceeded. Try again in ${resetIn} seconds. (${remaining} remaining)`,
      };
    }
  }

  const client = getFirecrawlClient();
  if (!client) {
    return {
      success: false,
      urls: [],
      error: 'Firecrawl not configured',
    };
  }

  try {
    console.log(`[Firecrawl Map] Starting map for ${normalizedUrl} with limit=${limit}`);

    // v2 API map returns MapData with links array
    const result = await client.map(normalizedUrl, {
      limit,
      includeSubdomains,
    });

    console.log(`[Firecrawl Map] Raw result:`, JSON.stringify(result).substring(0, 500));

    // v2 map endpoint returns links directly as an array of strings or objects
    let urls: string[] = [];

    if (result.links) {
      // Could be array of strings or array of objects with url property
      urls = result.links.map((link: string | { url: string }) =>
        typeof link === 'string' ? link : link.url
      ).filter(Boolean);
    } else if (Array.isArray(result)) {
      // Direct array of strings
      urls = result.filter((url): url is string => typeof url === 'string');
    }

    console.log(`[Firecrawl Map] Extracted ${urls.length} URLs`);

    // Cache successful result
    if (useCache && urls.length > 0) {
      await cacheUrlMap(domainKey, urls);
    }

    return {
      success: true,
      urls,
    };
  } catch (error) {
    console.error('[Firecrawl Map] Error:', error);
    return {
      success: false,
      urls: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Start a crawl job using v2 API
 * Note: v2 `crawl` method is synchronous (polls until complete)
 * For async with webhooks, we use the v1 API via client.v1
 */
export async function startCrawl(
  url: string,
  options: CrawlOptions = {}
): Promise<CrawlJobResult> {
  const {
    maxPages = 50,
    maxDepth = 3,
    includePaths,
    excludePaths,
    webhookUrl,
    webhookMetadata,
  } = options;

  const client = getFirecrawlClient();
  if (!client) {
    return {
      success: false,
      error: 'Firecrawl not configured',
    };
  }

  // Normalize URL
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

  try {
    console.log(`[Firecrawl Crawl] Starting async crawl for ${normalizedUrl}`);
    console.log(`[Firecrawl Crawl] Options: maxPages=${maxPages}, maxDepth=${maxDepth}, webhookUrl=${webhookUrl}`);

    // Use v1 API for async crawl with webhooks
    const crawlOptions: Record<string, unknown> = {
      limit: maxPages,
      maxDepth,
      scrapeOptions: {
        formats: ['markdown'],
      },
      // Allow crawling all paths by default for better discovery
      allowBackwardLinks: true,
      allowExternalLinks: false,
    };

    if (includePaths?.length) {
      crawlOptions.includePaths = includePaths;
    }

    if (excludePaths?.length) {
      crawlOptions.excludePaths = excludePaths;
    } else {
      // Default exclusions to avoid irrelevant pages
      crawlOptions.excludePaths = [
        '/cdn-cgi/*',
        '*.pdf',
        '*.zip',
        '*.exe',
        '/wp-admin/*',
        '/wp-json/*',
        '/feed/*',
        '/cart*',
        '/checkout*',
        '/my-account*',
        '/login*',
        '/register*',
        '/password*',
      ];
    }

    if (webhookUrl) {
      crawlOptions.webhook = webhookUrl;
    }

    console.log(`[Firecrawl Crawl] Full options:`, JSON.stringify(crawlOptions).substring(0, 500));

    // Use v1 asyncCrawlUrl for webhook support
    const result = await client.v1.asyncCrawlUrl(normalizedUrl, crawlOptions);

    console.log(`[Firecrawl Crawl] Result:`, JSON.stringify(result));

    if (!result.success || !('id' in result) || !result.id) {
      console.error(`[Firecrawl Crawl] Failed to start: success=${result.success}, id=${'id' in result ? result.id : 'none'}`);
      return {
        success: false,
        error: 'Failed to start crawl job',
      };
    }

    console.log(`[Firecrawl Crawl] Job started successfully: ${result.id}`);

    return {
      success: true,
      jobId: result.id,
      status: 'pending',
    };
  } catch (error) {
    console.error('[Firecrawl Crawl] Start error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get crawl job status using v1 API
 */
export async function getCrawlStatus(jobId: string): Promise<CrawlStatusResult> {
  const client = getFirecrawlClient();
  if (!client) {
    return {
      success: false,
      status: 'failed',
      error: 'Firecrawl not configured',
    };
  }

  try {
    console.log(`[Firecrawl Status] Checking status for job ${jobId}`);

    // Use v1 API for status check
    const result = await client.v1.checkCrawlStatus(jobId);

    if (!result.success) {
      console.error(`[Firecrawl Status] Failed to get status`);
      return {
        success: false,
        status: 'failed',
        error: 'Failed to get crawl status',
      };
    }

    // Log status details (only if success)
    console.log(`[Firecrawl Status] Response: status=${result.status}, completed=${result.completed}, total=${result.total}, data.length=${result.data?.length || 0}`);

    // Map Firecrawl status to our status
    let status: CrawlStatusResult['status'] = 'pending';
    if (result.status === 'completed') {
      status = 'completed';
    } else if (result.status === 'failed') {
      status = 'failed';
    } else if (result.status === 'scraping') {
      status = 'scraping';
    }

    // Map crawled data
    const data: ScrapeResult[] = (result.data || []).map((item: {
      url?: string;
      markdown?: string;
      html?: string;
      metadata?: {
        title?: string;
        description?: string;
      };
    }) => ({
      success: true,
      url: item.url || '',
      markdown: item.markdown,
      html: item.html,
      title: item.metadata?.title,
      description: item.metadata?.description,
    }));

    return {
      success: true,
      status,
      progress: result.completed ?? 0,
      total: result.total,
      data,
    };
  } catch (error) {
    console.error('Firecrawl status error:', error);
    return {
      success: false,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Cancel a running crawl job using v1 API
 */
export async function cancelCrawl(jobId: string): Promise<{ success: boolean; error?: string }> {
  const client = getFirecrawlClient();
  if (!client) {
    return {
      success: false,
      error: 'Firecrawl not configured',
    };
  }

  try {
    await client.v1.cancelCrawl(jobId);
    return { success: true };
  } catch (error) {
    console.error('Firecrawl cancel error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

/**
 * Filter URLs to prioritize important pages
 */
export function filterPriorityUrls(urls: string[], limit: number = 50): string[] {
  // Priority patterns (higher = more important)
  const priorityPatterns = [
    { pattern: /\/(about|company|team|who-we-are)/i, weight: 10 },
    { pattern: /\/(services?|products?|solutions?|offerings?)/i, weight: 9 },
    { pattern: /\/(pricing|plans?)/i, weight: 8 },
    { pattern: /\/(features?|capabilities)/i, weight: 8 },
    { pattern: /\/(blog|articles?|news|resources?)/i, weight: 7 },
    { pattern: /\/(contact|support|help)/i, weight: 6 },
    { pattern: /\/(faq|how-it-works)/i, weight: 5 },
    { pattern: /\/$/, weight: 10 }, // Homepage
  ];

  // Score and sort URLs
  const scoredUrls = urls.map((url) => {
    let score = 0;
    for (const { pattern, weight } of priorityPatterns) {
      if (pattern.test(url)) {
        score = Math.max(score, weight);
      }
    }
    // Penalize deep paths
    const pathDepth = (url.match(/\//g) || []).length;
    score -= pathDepth * 0.5;
    return { url, score };
  });

  // Sort by score descending and take top N
  return scoredUrls
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.url);
}
