/**
 * Firecrawl Webhook Handler
 *
 * Receives crawl events from Firecrawl and updates the database accordingly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { cacheCrawledPage } from '@/lib/cache/redis';

// Webhook event types from Firecrawl
type FirecrawlEventType =
  | 'crawl.started'
  | 'crawl.page'
  | 'crawl.completed'
  | 'crawl.failed';

interface FirecrawlWebhookPayload {
  type: FirecrawlEventType;
  id: string; // Firecrawl job ID
  success: boolean;
  data?: Array<{
    url: string;
    markdown?: string;
    html?: string;
    metadata?: {
      title?: string;
      description?: string;
      keywords?: string;
      ogImage?: string;
    };
  }>;
  error?: string;
  metadata?: {
    crawlJobId?: string;
    brandId?: string;
    teamId?: string;
  };
}

/**
 * Hash content for deduplication
 */
function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Extract key topics from markdown content
 */
function extractKeyTopics(markdown: string): string[] {
  const topics: string[] = [];

  // Extract from headings
  const headingMatches = markdown.match(/^#{1,3}\s+(.+)$/gm);
  if (headingMatches) {
    for (const match of headingMatches.slice(0, 10)) {
      const topic = match.replace(/^#+\s+/, '').trim();
      if (topic.length > 3 && topic.length < 100) {
        topics.push(topic);
      }
    }
  }

  return topics.slice(0, 10);
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json() as FirecrawlWebhookPayload;

    console.log(`[Firecrawl Webhook] Received event: ${payload.type}, Job ID: ${payload.id}`);

    // Get metadata from webhook
    const { crawlJobId, brandId, teamId } = payload.metadata || {};

    if (!crawlJobId || !brandId) {
      console.error('[Firecrawl Webhook] Missing required metadata');
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    const supabase = createAdminClient();

    switch (payload.type) {
      case 'crawl.started':
        // Update crawl job status to in progress
        await supabase
          .from('crawl_jobs')
          .update({
            status: 'in_progress',
            started_at: new Date().toISOString(),
          })
          .eq('id', crawlJobId);
        break;

      case 'crawl.page':
        // Store individual crawled page
        if (payload.data && payload.data.length > 0) {
          const page = payload.data[0];

          // Cache the page content
          if (page.markdown) {
            await cacheCrawledPage(page.url, {
              markdown: page.markdown,
              title: page.metadata?.title,
              description: page.metadata?.description,
              crawledAt: new Date().toISOString(),
            });
          }

          // Store in database
          const { error: insertError } = await supabase
            .from('crawled_pages')
            .upsert({
              brand_id: brandId,
              crawl_job_id: crawlJobId,
              url: page.url,
              title: page.metadata?.title || null,
              meta_description: page.metadata?.description || null,
              markdown_content: page.markdown || null,
              plain_text: page.markdown?.replace(/[#*_`\[\]()]/g, '') || null,
              content_hash: page.markdown ? hashContent(page.markdown) : null,
              key_topics: page.markdown ? extractKeyTopics(page.markdown) : [],
              crawled_at: new Date().toISOString(),
              is_active: true,
            }, {
              onConflict: 'url,brand_id',
            });

          if (insertError) {
            console.error('[Firecrawl Webhook] Error inserting page:', insertError);
          }

          // Update crawl job progress
          const { data: jobData } = await supabase
            .from('crawl_jobs')
            .select('pages_crawled')
            .eq('id', crawlJobId)
            .single();

          await supabase
            .from('crawl_jobs')
            .update({
              pages_crawled: (jobData?.pages_crawled || 0) + 1,
            })
            .eq('id', crawlJobId);
        }
        break;

      case 'crawl.completed':
        // Update crawl job as completed
        const { data: finalJob } = await supabase
          .from('crawl_jobs')
          .select('pages_crawled')
          .eq('id', crawlJobId)
          .single();

        await supabase
          .from('crawl_jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', crawlJobId);

        // Log usage
        if (teamId) {
          await supabase
            .from('crawl_usage_log')
            .insert({
              team_id: teamId,
              crawl_job_id: crawlJobId,
              pages_crawled: finalJob?.pages_crawled || 0,
              credits_used: finalJob?.pages_crawled || 0, // 1 credit per page
            });
        }

        // Update brand status to indicate content is available
        await supabase
          .from('brands')
          .update({
            status: 'active',
          })
          .eq('id', brandId);

        console.log(`[Firecrawl Webhook] Crawl completed: ${finalJob?.pages_crawled} pages`);
        break;

      case 'crawl.failed':
        // Update crawl job as failed
        await supabase
          .from('crawl_jobs')
          .update({
            status: 'failed',
            error_message: payload.error || 'Unknown error',
            completed_at: new Date().toISOString(),
          })
          .eq('id', crawlJobId);

        console.error(`[Firecrawl Webhook] Crawl failed: ${payload.error}`);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Firecrawl Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Firecrawl may send GET requests to verify webhook
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
