/**
 * Crawl Actions
 *
 * Server actions for managing crawl jobs and crawled pages.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  scrapeUrl,
  mapDomain,
  startCrawl,
  getCrawlStatus as getFirecrawlStatus,
  cancelCrawl as cancelFirecrawlCrawl,
  filterPriorityUrls,
  isFirecrawlConfigured,
} from '@/lib/services/firecrawl';
import type { Database } from '@/types/database';

type CrawlJob = Database['public']['Tables']['crawl_jobs']['Row'];
type CrawledPage = Database['public']['Tables']['crawled_pages']['Row'];

// ============================================
// Crawl Job Actions
// ============================================

/**
 * Create a new crawl job for a brand
 */
export async function createCrawlJob(
  brandId: string,
  options: {
    seedUrls: string[];
    maxPages?: number;
  }
): Promise<{ data: CrawlJob | null; error: string | null }> {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: 'Unauthorized' };
  }

  // Get brand to verify team access
  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .select('id, team_id, website_url')
    .eq('id', brandId)
    .single();

  if (brandError || !brand) {
    return { data: null, error: 'Brand not found' };
  }

  const { seedUrls, maxPages = 50 } = options;

  // Create crawl job record
  const { data: crawlJob, error: createError } = await supabase
    .from('crawl_jobs')
    .insert({
      brand_id: brandId,
      seed_urls: seedUrls,
      max_pages: maxPages,
      status: 'pending',
      started_by: user.id,
      pages_crawled: 0,
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating crawl job:', createError);
    return { data: null, error: 'Failed to create crawl job' };
  }

  // Start the actual crawl if Firecrawl is configured
  if (isFirecrawlConfigured() && seedUrls.length > 0) {
    const webhookUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/firecrawl`
      : undefined;

    console.log(`[Crawl] Starting crawl for ${seedUrls[0]} with maxPages=${maxPages}, maxDepth=3, webhookUrl=${webhookUrl}`);

    const crawlResult = await startCrawl(seedUrls[0], {
      maxPages,
      maxDepth: 3,
      webhookUrl,
      webhookMetadata: {
        crawlJobId: crawlJob.id,
        brandId,
        teamId: brand.team_id,
      },
    });

    console.log(`[Crawl] Firecrawl response:`, crawlResult.success ? `jobId=${crawlResult.jobId}` : `error=${crawlResult.error}`);

    if (!crawlResult.success) {
      // Update job as failed
      await supabase
        .from('crawl_jobs')
        .update({
          status: 'failed',
          error_message: crawlResult.error,
        })
        .eq('id', crawlJob.id);

      return { data: null, error: crawlResult.error || 'Failed to start crawl' };
    }

    // Update job with Firecrawl job ID for polling support
    await supabase
      .from('crawl_jobs')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
        firecrawl_job_id: crawlResult.jobId, // Store for polling
      })
      .eq('id', crawlJob.id);

    // Return updated job with firecrawl_job_id
    const { data: updatedJob } = await supabase
      .from('crawl_jobs')
      .select()
      .eq('id', crawlJob.id)
      .single();

    if (updatedJob) {
      revalidatePath(`/brands/${brandId}/crawled`);
      return { data: updatedJob, error: null };
    }
  }

  revalidatePath(`/brands/${brandId}/crawled`);
  return { data: crawlJob, error: null };
}

/**
 * Get crawl jobs for a brand
 */
export async function getCrawlJobs(
  brandId: string
): Promise<{ data: CrawlJob[] | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('crawl_jobs')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching crawl jobs:', error);
    return { data: null, error: 'Failed to fetch crawl jobs' };
  }

  return { data, error: null };
}

/**
 * Get a specific crawl job
 */
export async function getCrawlJob(
  jobId: string
): Promise<{ data: CrawlJob | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('crawl_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) {
    console.error('Error fetching crawl job:', error);
    return { data: null, error: 'Failed to fetch crawl job' };
  }

  return { data, error: null };
}

/**
 * Poll Firecrawl for crawl status and update database
 * Used for local development where webhooks can't reach localhost
 */
export async function pollCrawlStatus(
  jobId: string
): Promise<{
  status: string;
  progress: number;
  total: number;
  completed: boolean;
  error: string | null;
  crawledUrls: string[];
}> {
  const supabase = await createClient();

  // Get job with firecrawl_job_id
  const { data: job, error: jobError } = await supabase
    .from('crawl_jobs')
    .select('*, brands(team_id)')
    .eq('id', jobId)
    .single();

  if (jobError || !job) {
    return { status: 'failed', progress: 0, total: 0, completed: false, error: 'Job not found', crawledUrls: [] };
  }

  // If already completed or failed, return current status with crawled pages
  if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
    // Get already crawled pages from database
    const { data: existingPages } = await supabase
      .from('crawled_pages')
      .select('url')
      .eq('crawl_job_id', jobId)
      .order('crawled_at', { ascending: false });

    return {
      status: job.status,
      progress: job.pages_crawled || 0,
      total: job.max_pages || 0,
      completed: job.status === 'completed',
      error: null,
      crawledUrls: existingPages?.map(p => p.url) || [],
    };
  }

  // Get Firecrawl job ID
  const firecrawlJobId = job.firecrawl_job_id;
  if (!firecrawlJobId) {
    return { status: 'pending', progress: 0, total: 0, completed: false, error: 'No Firecrawl job ID', crawledUrls: [] };
  }

  // Poll Firecrawl
  const statusResult = await getFirecrawlStatus(firecrawlJobId);

  if (!statusResult.success) {
    return { status: 'failed', progress: 0, total: 0, completed: false, error: statusResult.error || 'Failed to get status', crawledUrls: [] };
  }

  // Extract URLs from current crawl data
  const crawledUrls = statusResult.data?.map(d => d.url).filter(Boolean) as string[] || [];

  // Update database with progress
  const updates: Record<string, unknown> = {
    pages_crawled: statusResult.progress || 0,
  };

  if (statusResult.status === 'completed') {
    updates.status = 'completed';
    updates.completed_at = new Date().toISOString();

    // Store crawled pages
    if (statusResult.data && statusResult.data.length > 0) {
      for (const page of statusResult.data) {
        if (page.url && page.markdown) {
          await supabase.from('crawled_pages').upsert(
            {
              brand_id: job.brand_id,
              crawl_job_id: jobId,
              url: page.url,
              title: page.title || null,
              meta_description: page.description || null,
              markdown_content: page.markdown,
              plain_text: page.markdown.replace(/[#*_`\[\]()]/g, ''),
              crawled_at: new Date().toISOString(),
              is_active: true,
            },
            { onConflict: 'url,brand_id' }
          );
        }
      }

      // Update brand status
      await supabase
        .from('brands')
        .update({ status: 'active' })
        .eq('id', job.brand_id);
    }
  } else if (statusResult.status === 'failed') {
    updates.status = 'failed';
    updates.error_message = 'Crawl failed';
    updates.completed_at = new Date().toISOString();
  } else {
    updates.status = 'in_progress';
  }

  await supabase.from('crawl_jobs').update(updates).eq('id', jobId);

  revalidatePath(`/brands/${job.brand_id}/crawled`);

  return {
    status: statusResult.status,
    progress: statusResult.progress || 0,
    total: statusResult.total || job.max_pages || 0,
    completed: statusResult.status === 'completed',
    error: null,
    crawledUrls,
  };
}

/**
 * Cancel a running crawl job
 */
export async function cancelCrawlJob(
  jobId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  // Get job to verify access
  const { data: job, error: jobError } = await supabase
    .from('crawl_jobs')
    .select('*, brands(team_id)')
    .eq('id', jobId)
    .single();

  if (jobError || !job) {
    return { success: false, error: 'Job not found' };
  }

  // Cancel in Firecrawl if applicable
  // Note: We'd need to store the Firecrawl job ID to do this
  // For now, just update the database status

  const { error: updateError } = await supabase
    .from('crawl_jobs')
    .update({
      status: 'cancelled',
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  if (updateError) {
    return { success: false, error: 'Failed to cancel job' };
  }

  revalidatePath(`/brands/${job.brand_id}/crawled`);
  return { success: true, error: null };
}

// ============================================
// Crawled Pages Actions
// ============================================

/**
 * Get crawled pages for a brand
 */
export async function getCrawledPages(
  brandId: string,
  options: {
    limit?: number;
    offset?: number;
    search?: string;
  } = {}
): Promise<{ data: CrawledPage[] | null; total: number; error: string | null }> {
  const supabase = await createClient();
  const { limit = 50, offset = 0, search } = options;

  let query = supabase
    .from('crawled_pages')
    .select('*', { count: 'exact' })
    .eq('brand_id', brandId)
    .eq('is_active', true)
    .order('crawled_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`title.ilike.%${search}%,url.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching crawled pages:', error);
    return { data: null, total: 0, error: 'Failed to fetch crawled pages' };
  }

  return { data, total: count || 0, error: null };
}

/**
 * Get a specific crawled page
 */
export async function getCrawledPage(
  pageId: string
): Promise<{ data: CrawledPage | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('crawled_pages')
    .select('*')
    .eq('id', pageId)
    .single();

  if (error) {
    console.error('Error fetching crawled page:', error);
    return { data: null, error: 'Failed to fetch crawled page' };
  }

  return { data, error: null };
}

/**
 * Delete a crawled page (soft delete)
 */
export async function deleteCrawledPage(
  pageId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  // Get page to verify access
  const { data: page, error: pageError } = await supabase
    .from('crawled_pages')
    .select('brand_id')
    .eq('id', pageId)
    .single();

  if (pageError || !page) {
    return { success: false, error: 'Page not found' };
  }

  const { error: updateError } = await supabase
    .from('crawled_pages')
    .update({ is_active: false })
    .eq('id', pageId);

  if (updateError) {
    return { success: false, error: 'Failed to delete page' };
  }

  revalidatePath(`/brands/${page.brand_id}/crawled`);
  return { success: true, error: null };
}

// ============================================
// Single Page Scraping
// ============================================

/**
 * Scrape a single URL and store it
 */
export async function scrapeSingleUrl(
  brandId: string,
  url: string
): Promise<{ data: CrawledPage | null; error: string | null }> {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: 'Unauthorized' };
  }

  // Get brand to verify access and get team_id
  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .select('id, team_id')
    .eq('id', brandId)
    .single();

  if (brandError || !brand) {
    return { data: null, error: 'Brand not found' };
  }

  // Scrape the URL
  const scrapeResult = await scrapeUrl(url, {
    formats: ['markdown'],
    useCache: true,
    teamId: brand.team_id,
  });

  if (!scrapeResult.success) {
    return { data: null, error: scrapeResult.error || 'Failed to scrape URL' };
  }

  // Store in database
  const { data: page, error: insertError } = await supabase
    .from('crawled_pages')
    .upsert({
      brand_id: brandId,
      url,
      title: scrapeResult.title || null,
      meta_description: scrapeResult.description || null,
      markdown_content: scrapeResult.markdown || null,
      plain_text: scrapeResult.markdown?.replace(/[#*_`\[\]()]/g, '') || null,
      crawled_at: new Date().toISOString(),
      is_active: true,
    }, {
      onConflict: 'url,brand_id',
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error storing scraped page:', insertError);
    return { data: null, error: 'Failed to store scraped page' };
  }

  revalidatePath(`/brands/${brandId}/crawled`);
  return { data: page, error: null };
}

// ============================================
// URL Discovery
// ============================================

/**
 * Discover URLs on a domain
 */
export async function discoverUrls(
  domain: string,
  options: {
    teamId?: string;
    limit?: number;
    prioritize?: boolean;
  } = {}
): Promise<{ urls: string[]; error: string | null }> {
  const { teamId, limit = 100, prioritize = true } = options;

  const mapResult = await mapDomain(domain, {
    limit: prioritize ? limit * 2 : limit, // Get more for filtering
    useCache: true,
    teamId,
  });

  if (!mapResult.success) {
    return { urls: [], error: mapResult.error || 'Failed to discover URLs' };
  }

  // Filter and prioritize URLs
  const urls = prioritize
    ? filterPriorityUrls(mapResult.urls, limit)
    : mapResult.urls.slice(0, limit);

  return { urls, error: null };
}

// ============================================
// Brand Discovery Workflow
// ============================================

/**
 * Start brand discovery workflow
 * 1. Map the domain to discover URLs
 * 2. Create a crawl job
 * 3. Start crawling priority pages
 */
export async function startBrandDiscovery(
  brandId: string,
  websiteUrl: string
): Promise<{
  crawlJobId: string | null;
  discoveredUrls: string[];
  error: string | null;
}> {
  const supabase = await createClient();

  // Get brand to verify access
  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .select('id, team_id')
    .eq('id', brandId)
    .single();

  if (brandError || !brand) {
    return { crawlJobId: null, discoveredUrls: [], error: 'Brand not found' };
  }

  // Update brand status to discovering
  await supabase
    .from('brands')
    .update({ status: 'discovering' })
    .eq('id', brandId);

  // Step 1: Discover URLs
  const { urls, error: discoverError } = await discoverUrls(websiteUrl, {
    teamId: brand.team_id,
    limit: 50,
    prioritize: true,
  });

  if (discoverError || urls.length === 0) {
    // Fall back to just the main URL
    const fallbackUrls = [websiteUrl];

    const { data: crawlJob, error: createError } = await createCrawlJob(brandId, {
      seedUrls: fallbackUrls,
      maxPages: 20,
    });

    if (createError) {
      await supabase
        .from('brands')
        .update({ status: 'failed' })
        .eq('id', brandId);
      return { crawlJobId: null, discoveredUrls: [], error: createError };
    }

    return {
      crawlJobId: crawlJob?.id || null,
      discoveredUrls: fallbackUrls,
      error: null,
    };
  }

  // Step 2: Create crawl job with discovered URLs
  const { data: crawlJob, error: createError } = await createCrawlJob(brandId, {
    seedUrls: urls,
    maxPages: Math.min(urls.length, 50),
  });

  if (createError) {
    await supabase
      .from('brands')
      .update({ status: 'failed' })
      .eq('id', brandId);
    return { crawlJobId: null, discoveredUrls: urls, error: createError };
  }

  revalidatePath(`/brands/${brandId}`);
  return {
    crawlJobId: crawlJob?.id || null,
    discoveredUrls: urls,
    error: null,
  };
}

/**
 * Check Firecrawl configuration status
 */
export async function checkFirecrawlConfig(): Promise<{
  configured: boolean;
  error: string | null;
}> {
  return {
    configured: isFirecrawlConfigured(),
    error: isFirecrawlConfigured() ? null : 'Firecrawl API key not configured',
  };
}
