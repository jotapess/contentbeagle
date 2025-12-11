/**
 * Firecrawl Service
 *
 * Web scraping and crawling integration
 */

export {
  // Client
  getFirecrawlClient,
  isFirecrawlConfigured,

  // Scraping
  scrapeUrl,

  // Mapping
  mapDomain,

  // Crawling
  startCrawl,
  getCrawlStatus,
  cancelCrawl,

  // Utilities
  extractDomain,
  filterPriorityUrls,

  // Types
  type ScrapeResult,
  type MapResult,
  type CrawlJobResult,
  type CrawlStatusResult,
  type CrawlOptions,
} from './client';
