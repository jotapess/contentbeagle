/**
 * Crawl Polling API Endpoint
 *
 * Polls Firecrawl for status updates and stores results in the database.
 * Used for local development where webhooks can't reach localhost.
 */

import { NextRequest, NextResponse } from 'next/server';
import { pollCrawlStatus } from '@/lib/actions/crawl';
import { runFullIntelligencePipeline } from '@/lib/actions/intelligence';

export async function POST(request: NextRequest) {
  try {
    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json({ error: 'jobId required' }, { status: 400 });
    }

    const result = await pollCrawlStatus(jobId);

    // If crawl just completed, trigger intelligence extraction
    if (result.completed && result.progress > 0) {
      // Get brand ID from the job to trigger extraction
      // The pollCrawlStatus already stores pages, we just need to get brandId
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();

      const { data: job } = await supabase
        .from('crawl_jobs')
        .select('brand_id')
        .eq('id', jobId)
        .single();

      if (job?.brand_id) {
        // Trigger intelligence extraction asynchronously
        runFullIntelligencePipeline(job.brand_id)
          .then((res) => {
            if (res.success) {
              console.log(`[Crawl Poll] Intelligence extraction completed for brand ${job.brand_id}`);
            } else {
              console.error(`[Crawl Poll] Intelligence extraction failed: ${res.error}`);
            }
          })
          .catch((error) => {
            console.error(`[Crawl Poll] Intelligence extraction error:`, error);
          });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Crawl Poll] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
