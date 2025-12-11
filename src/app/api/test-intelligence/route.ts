/**
 * Test endpoint for intelligence extraction
 * DELETE THIS IN PRODUCTION
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createUserProviderRegistry, getDefaultModel } from '@/lib/ai/provider-registry';
import {
  batchExtractPageIntelligence,
  extractBrandVoice,
} from '@/lib/services/intelligence/extraction';
import { createBrandIntelligenceSummary } from '@/lib/services/intelligence/aggregation';

export async function POST(request: NextRequest) {
  try {
    const { brandId } = await request.json();

    if (!brandId) {
      return NextResponse.json({ error: 'brandId required' }, { status: 400 });
    }

    console.log('[Test Intelligence] Starting pipeline for brand:', brandId);

    const supabase = createAdminClient();

    // Get brand info
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id, name, team_id')
      .eq('id', brandId)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Get API keys from env (for testing)
    const apiKeys = {
      openai: process.env.OPENAI_API_KEY,
    };

    const defaultModelId = getDefaultModel(apiKeys);
    if (!defaultModelId) {
      return NextResponse.json({ error: 'No AI provider configured' }, { status: 400 });
    }

    // Create or update intelligence record
    const { data: existingIntel } = await supabase
      .from('brand_intelligence')
      .select('id')
      .eq('brand_id', brandId)
      .single();

    if (!existingIntel) {
      await supabase.from('brand_intelligence').insert({
        brand_id: brandId,
        extraction_status: 'extracting',
      });
    } else {
      await supabase
        .from('brand_intelligence')
        .update({ extraction_status: 'extracting', extraction_error: null })
        .eq('brand_id', brandId);
    }

    // Get crawled pages
    const { data: pages, error: pagesError } = await supabase
      .from('crawled_pages')
      .select('id, url, title, markdown_content')
      .eq('brand_id', brandId)
      .eq('is_active', true)
      .not('markdown_content', 'is', null)
      .limit(10);

    if (pagesError || !pages || pages.length === 0) {
      await supabase
        .from('brand_intelligence')
        .update({ extraction_status: 'failed', extraction_error: 'No pages' })
        .eq('brand_id', brandId);
      return NextResponse.json({ error: 'No crawled pages' }, { status: 400 });
    }

    console.log('[Test Intelligence] Processing', pages.length, 'pages');

    // Create registry and model
    const registry = createUserProviderRegistry(apiKeys);
    const model = registry.languageModel(defaultModelId as `${string}:${string}`);

    // Prepare pages
    const pagesToExtract = pages.map((p) => ({
      id: p.id,
      url: p.url,
      title: p.title,
      content: p.markdown_content || '',
    }));

    // Extract intelligence
    console.log('[Test Intelligence] Extracting page intelligence...');
    const pageExtractions = await batchExtractPageIntelligence(pagesToExtract, model);
    console.log('[Test Intelligence] Extracted from', pageExtractions.size, 'pages');

    // Build URL lookup
    const pageUrls = new Map(pages.map((p) => [p.id, p.url]));

    // Extract brand voice
    console.log('[Test Intelligence] Extracting brand voice...');
    const brandVoice = await extractBrandVoice(
      pagesToExtract.slice(0, 5).map((p) => ({
        url: p.url,
        title: p.title,
        content: p.content,
      })),
      brand.name,
      model
    );

    // Aggregate
    const summary = createBrandIntelligenceSummary(pageExtractions, pageUrls, brandVoice);

    // Update crawled_pages
    for (const [pageId, extraction] of pageExtractions) {
      await supabase
        .from('crawled_pages')
        .update({
          extracted_keywords: extraction.keywords.map((k) => k.term),
          content_category: extraction.contentCategory,
          primary_topic: extraction.primaryTopic,
        })
        .eq('id', pageId);
    }

    // Store intelligence
    await supabase
      .from('brand_intelligence')
      .update({
        extracted_keywords: JSON.parse(JSON.stringify(summary.extractedKeywords)),
        extracted_topics: JSON.parse(JSON.stringify(summary.extractedTopics)),
        voice_summary: JSON.parse(JSON.stringify(summary.voiceSummary)),
        pages_analyzed: summary.pagesAnalyzed,
        extraction_status: 'completed',
        extraction_error: null,
        extraction_model: defaultModelId,
        last_extraction_at: new Date().toISOString(),
      })
      .eq('brand_id', brandId);

    console.log('[Test Intelligence] Pipeline complete!');

    return NextResponse.json({
      success: true,
      pagesAnalyzed: summary.pagesAnalyzed,
      keywordsExtracted: summary.extractedKeywords.length,
      topicsExtracted: summary.extractedTopics.length,
    });
  } catch (error) {
    console.error('[Test Intelligence] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
