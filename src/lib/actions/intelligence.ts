/**
 * Intelligence Actions
 *
 * Server actions for brand intelligence extraction and management.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getDecryptedAPIKeys } from "./api-keys";
import { createUserProviderRegistry, getDefaultModel } from "@/lib/ai/provider-registry";
import {
  extractPageIntelligence,
  extractBrandVoice,
  batchExtractPageIntelligence,
  type PageExtraction,
} from "@/lib/services/intelligence/extraction";
import {
  createBrandIntelligenceSummary,
  identifyContentGaps,
} from "@/lib/services/intelligence/aggregation";
import type { Database } from "@/types/database";

type BrandIntelligence = Database["public"]["Tables"]["brand_intelligence"]["Row"];

/**
 * Get brand intelligence record
 */
export async function getBrandIntelligence(
  brandId: string
): Promise<{ data: BrandIntelligence | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("brand_intelligence")
    .select("*")
    .eq("brand_id", brandId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned
    console.error("Error fetching brand intelligence:", error);
    return { data: null, error: "Failed to fetch brand intelligence" };
  }

  return { data: data || null, error: null };
}

/**
 * Trigger intelligence extraction for a brand
 *
 * This is called after a crawl completes to extract keywords,
 * topics, and brand voice from the crawled pages.
 */
export async function triggerIntelligenceExtraction(
  brandId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  // Get brand and team info
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, name, team_id, industry")
    .eq("id", brandId)
    .single();

  if (brandError || !brand) {
    return { success: false, error: "Brand not found" };
  }

  // Get user's API keys
  const { data: apiKeys, error: keysError } = await getDecryptedAPIKeys(brand.team_id);

  if (keysError || !apiKeys) {
    return { success: false, error: "No API keys configured" };
  }

  // Get default model
  const defaultModelId = getDefaultModel(apiKeys);
  if (!defaultModelId) {
    return { success: false, error: "No AI provider configured" };
  }

  // Create or get intelligence record
  const { data: existingIntel } = await supabase
    .from("brand_intelligence")
    .select("id")
    .eq("brand_id", brandId)
    .single();

  if (!existingIntel) {
    await supabase.from("brand_intelligence").insert({
      brand_id: brandId,
      extraction_status: "extracting",
    });
  } else {
    await supabase
      .from("brand_intelligence")
      .update({ extraction_status: "extracting", extraction_error: null })
      .eq("brand_id", brandId);
  }

  // Get crawled pages
  const { data: pages, error: pagesError } = await supabase
    .from("crawled_pages")
    .select("id, url, title, markdown_content")
    .eq("brand_id", brandId)
    .eq("is_active", true)
    .not("markdown_content", "is", null)
    .order("crawled_at", { ascending: false })
    .limit(20); // Process top 20 pages

  if (pagesError || !pages || pages.length === 0) {
    await supabase
      .from("brand_intelligence")
      .update({
        extraction_status: "failed",
        extraction_error: "No crawled pages available",
      })
      .eq("brand_id", brandId);
    return { success: false, error: "No crawled pages to analyze" };
  }

  try {
    // Create provider registry and get model
    const registry = createUserProviderRegistry(apiKeys);
    const model = registry.languageModel(defaultModelId as `${string}:${string}`);

    // Prepare pages for extraction
    const pagesToExtract = pages.map((p) => ({
      id: p.id,
      url: p.url,
      title: p.title,
      content: p.markdown_content || "",
    }));

    // Extract intelligence from all pages
    const pageExtractions = await batchExtractPageIntelligence(pagesToExtract, model);

    // Build URL lookup
    const pageUrls = new Map(pages.map((p) => [p.id, p.url]));

    // Extract brand voice from page samples
    const brandVoice = await extractBrandVoice(
      pagesToExtract.slice(0, 5).map((p) => ({
        url: p.url,
        title: p.title,
        content: p.content,
      })),
      brand.name,
      model
    );

    // Aggregate into brand intelligence
    const summary = createBrandIntelligenceSummary(pageExtractions, pageUrls, brandVoice);

    // Update crawled_pages with extracted keywords
    for (const [pageId, extraction] of pageExtractions) {
      await supabase
        .from("crawled_pages")
        .update({
          extracted_keywords: extraction.keywords.map((k) => k.term),
          content_category: extraction.contentCategory,
          primary_topic: extraction.primaryTopic,
        })
        .eq("id", pageId);
    }

    // Store brand intelligence
    await supabase
      .from("brand_intelligence")
      .update({
        extracted_keywords: JSON.parse(JSON.stringify(summary.extractedKeywords)),
        extracted_topics: JSON.parse(JSON.stringify(summary.extractedTopics)),
        voice_summary: JSON.parse(JSON.stringify(summary.voiceSummary)),
        pages_analyzed: summary.pagesAnalyzed,
        extraction_status: "completed",
        extraction_error: null,
        extraction_model: defaultModelId,
        last_extraction_at: new Date().toISOString(),
      })
      .eq("brand_id", brandId);

    revalidatePath(`/brands/${brandId}`);
    return { success: true, error: null };
  } catch (error) {
    console.error("Intelligence extraction failed:", error);

    await supabase
      .from("brand_intelligence")
      .update({
        extraction_status: "failed",
        extraction_error: error instanceof Error ? error.message : "Unknown error",
      })
      .eq("brand_id", brandId);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Extraction failed",
    };
  }
}

/**
 * Trigger keyword research using DataForSEO
 *
 * Takes extracted keywords and enriches them with search volume,
 * competition, and opportunity data.
 */
export async function triggerKeywordResearch(
  brandId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  // Get brand intelligence
  const { data: intelligence, error: intelError } = await supabase
    .from("brand_intelligence")
    .select("*")
    .eq("brand_id", brandId)
    .single();

  if (intelError || !intelligence) {
    return { success: false, error: "No brand intelligence found. Run extraction first." };
  }

  // Update status
  await supabase
    .from("brand_intelligence")
    .update({ extraction_status: "researching" })
    .eq("brand_id", brandId);

  try {
    // Get extracted keywords
    const extractedKeywords = intelligence.extracted_keywords as Array<{
      keyword: string;
      frequency: number;
      relevanceScore: number;
    }>;

    if (!extractedKeywords || extractedKeywords.length === 0) {
      await supabase
        .from("brand_intelligence")
        .update({ extraction_status: "completed" })
        .eq("brand_id", brandId);
      return { success: true, error: null };
    }

    // Import DataForSEO service
    const { getKeywordOpportunities } = await import("@/lib/services/dataforseo/keywords");

    // Get top keywords for research (limit to 20)
    const seedKeywords = extractedKeywords.slice(0, 20).map((k) => k.keyword);

    // Research keywords
    const { seedData, relatedData, apiCost } = await getKeywordOpportunities(seedKeywords);

    // Combine and format keyword opportunities
    const opportunities = [
      ...seedData.map((k) => ({
        keyword: k.keyword,
        searchVolume: k.searchVolume,
        competition: k.competition,
        cpc: k.cpc,
        opportunityScore: calculateOpportunityScore(k.searchVolume, k.competition),
      })),
      ...relatedData.map((k) => ({
        keyword: k.keyword,
        searchVolume: k.searchVolume,
        competition: k.competition,
        cpc: k.cpc,
        opportunityScore: calculateOpportunityScore(k.searchVolume, k.competition),
      })),
    ];

    // Sort by opportunity score
    opportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);

    // Identify content gaps
    const extractedTopics = intelligence.extracted_topics as Array<{
      topic: string;
      frequency: number;
      relatedKeywords: string[];
      sourcePages: string[];
    }>;

    const contentGaps = identifyContentGaps(
      extractedTopics || [],
      opportunities.map((o) => ({
        keyword: o.keyword,
        searchVolume: o.searchVolume,
        competition: o.competition,
      }))
    );

    // Update brand intelligence
    await supabase
      .from("brand_intelligence")
      .update({
        keyword_opportunities: JSON.parse(JSON.stringify(opportunities.slice(0, 100))),
        content_gaps: JSON.parse(JSON.stringify(contentGaps)),
        extraction_status: "completed",
        last_keyword_research_at: new Date().toISOString(),
      })
      .eq("brand_id", brandId);

    revalidatePath(`/brands/${brandId}`);
    return { success: true, error: null };
  } catch (error) {
    console.error("Keyword research failed:", error);

    await supabase
      .from("brand_intelligence")
      .update({
        extraction_status: "failed",
        extraction_error: error instanceof Error ? error.message : "Research failed",
      })
      .eq("brand_id", brandId);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Keyword research failed",
    };
  }
}

/**
 * Run the full intelligence pipeline
 *
 * 1. Extract keywords/topics from crawled pages
 * 2. Research keywords with DataForSEO
 * 3. Identify content gaps
 */
export async function runFullIntelligencePipeline(
  brandId: string
): Promise<{ success: boolean; error: string | null }> {
  // Step 1: Extract intelligence
  const extractionResult = await triggerIntelligenceExtraction(brandId);
  if (!extractionResult.success) {
    return extractionResult;
  }

  // Step 2: Research keywords (optional - only if DataForSEO is configured)
  const hasDataForSEO = process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD;
  if (hasDataForSEO) {
    const researchResult = await triggerKeywordResearch(brandId);
    if (!researchResult.success) {
      // Log but don't fail - extraction was successful
      console.warn("Keyword research failed:", researchResult.error);
    }
  }

  return { success: true, error: null };
}

/**
 * Calculate opportunity score for a keyword
 *
 * Higher score = higher search volume + lower competition
 */
function calculateOpportunityScore(searchVolume: number, competition: number): number {
  if (searchVolume === 0) return 0;

  // Normalize competition to 0-1 (it comes as 0-100)
  const normalizedCompetition = competition / 100;

  // Score formula: volume * (1 - competition)^2
  // Squares competition to penalize high competition more
  const score = searchVolume * Math.pow(1 - normalizedCompetition, 2);

  // Normalize to 0-100 scale
  return Math.min(100, Math.round(score / 100));
}

/**
 * Get keyword suggestions for article creation
 *
 * Returns keywords relevant to the brand, sorted by opportunity score.
 */
export async function getKeywordSuggestions(
  brandId: string,
  options: {
    limit?: number;
    minVolume?: number;
    topic?: string;
  } = {}
): Promise<{
  keywords: Array<{
    keyword: string;
    searchVolume: number;
    competition: number;
    opportunityScore: number;
  }>;
  error: string | null;
}> {
  const supabase = await createClient();
  const { limit = 20, minVolume = 0, topic } = options;

  const { data: intelligence, error } = await supabase
    .from("brand_intelligence")
    .select("keyword_opportunities, extracted_keywords")
    .eq("brand_id", brandId)
    .single();

  if (error || !intelligence) {
    return { keywords: [], error: "No brand intelligence found" };
  }

  // Prefer researched keywords if available
  let keywords = intelligence.keyword_opportunities as Array<{
    keyword: string;
    searchVolume: number;
    competition: number;
    opportunityScore: number;
  }> | null;

  // Filter by minimum volume
  if (keywords) {
    keywords = keywords.filter((k) => k.searchVolume >= minVolume);

    // Filter by topic if provided
    if (topic) {
      const topicLower = topic.toLowerCase();
      keywords = keywords.filter((k) => k.keyword.toLowerCase().includes(topicLower));
    }

    return { keywords: keywords.slice(0, limit), error: null };
  }

  // Fall back to extracted keywords (without volume data)
  const extracted = intelligence.extracted_keywords as Array<{
    keyword: string;
    frequency: number;
    relevanceScore: number;
  }> | null;

  if (extracted) {
    const fallbackKeywords = extracted.slice(0, limit).map((k) => ({
      keyword: k.keyword,
      searchVolume: 0, // Unknown
      competition: 0, // Unknown
      opportunityScore: Math.round(k.relevanceScore * 100),
    }));
    return { keywords: fallbackKeywords, error: null };
  }

  return { keywords: [], error: null };
}

/**
 * Get topic suggestions for article creation
 *
 * Returns topics the brand covers, plus content gaps to explore.
 */
export async function getTopicSuggestions(
  brandId: string,
  options: { includeGaps?: boolean; limit?: number } = {}
): Promise<{
  topics: Array<{
    topic: string;
    type: "existing" | "gap";
    frequency?: number;
    searchVolume?: number;
    reason?: string;
  }>;
  error: string | null;
}> {
  const supabase = await createClient();
  const { includeGaps = true, limit = 20 } = options;

  const { data: intelligence, error } = await supabase
    .from("brand_intelligence")
    .select("extracted_topics, content_gaps")
    .eq("brand_id", brandId)
    .single();

  if (error || !intelligence) {
    return { topics: [], error: "No brand intelligence found" };
  }

  const topics: Array<{
    topic: string;
    type: "existing" | "gap";
    frequency?: number;
    searchVolume?: number;
    reason?: string;
  }> = [];

  // Add existing topics
  const extractedTopics = intelligence.extracted_topics as Array<{
    topic: string;
    frequency: number;
  }> | null;

  if (extractedTopics) {
    for (const t of extractedTopics.slice(0, Math.floor(limit / 2))) {
      topics.push({
        topic: t.topic,
        type: "existing",
        frequency: t.frequency,
      });
    }
  }

  // Add content gaps
  if (includeGaps) {
    const gaps = intelligence.content_gaps as Array<{
      topic: string;
      reason: string;
      searchVolume: number;
    }> | null;

    if (gaps) {
      for (const g of gaps.slice(0, Math.floor(limit / 2))) {
        topics.push({
          topic: g.topic,
          type: "gap",
          searchVolume: g.searchVolume,
          reason: g.reason,
        });
      }
    }
  }

  return { topics: topics.slice(0, limit), error: null };
}
