"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  isDataForSEOConfigured,
  getSearchVolume,
  getRelatedKeywords,
  estimateCost,
  DEFAULT_LOCATION_CODE,
  DEFAULT_LANGUAGE_CODE,
  type KeywordVolumeData,
  type RelatedKeywordData,
} from "@/lib/services/dataforseo";
import {
  getCachedKeywords,
  cacheKeywords,
  DEFAULT_CACHE_TTL_DAYS,
} from "@/lib/cache/keyword-cache";
import type { Json } from "@/types/database";

export interface KeywordResearchResult {
  success: boolean;
  data?: {
    keywords: KeywordVolumeData[];
    relatedKeywords: RelatedKeywordData[];
    fromCache: number;
    fromApi: number;
  };
  error?: string;
  warnings?: string[];
}

export interface SavedKeywordResearch {
  id: string;
  keyword: string;
  searchVolume: number | null;
  competition: number | null;
  competitionLevel: string | null;
  cpc: number | null;
  relatedKeywords: RelatedKeywordData[] | null;
  fetchedAt: string | null;
}

/**
 * Research keywords for an article
 *
 * Fetches search volume and related keywords from DataForSEO,
 * using cache when available to minimize API costs.
 */
export async function researchKeywords(
  keywords: string[],
  options: {
    teamId: string;
    articleId?: string;
    brandId?: string;
    locationCode?: number;
    languageCode?: string;
    includeRelated?: boolean;
    cacheTtlDays?: number;
  }
): Promise<KeywordResearchResult> {
  const supabase = await createClient();
  const warnings: string[] = [];

  // Validate authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Validate input
  if (!keywords || keywords.length === 0) {
    return { success: false, error: "No keywords provided" };
  }

  // Normalize keywords
  const normalizedKeywords = [...new Set(keywords.map((k) => k.trim().toLowerCase()))].filter(
    (k) => k.length > 0
  );

  if (normalizedKeywords.length === 0) {
    return { success: false, error: "No valid keywords provided" };
  }

  const locationCode = options.locationCode || DEFAULT_LOCATION_CODE;
  const languageCode = options.languageCode || DEFAULT_LANGUAGE_CODE;
  const includeRelated = options.includeRelated ?? true;

  // Check cache first
  const cachedData = await getCachedKeywords(normalizedKeywords, locationCode);
  const cachedKeywords: KeywordVolumeData[] = [];
  const uncachedKeywords: string[] = [];

  for (const keyword of normalizedKeywords) {
    const cached = cachedData.get(keyword);
    if (cached) {
      cachedKeywords.push(cached);
    } else {
      uncachedKeywords.push(keyword);
    }
  }

  let apiKeywords: KeywordVolumeData[] = [];
  let relatedKeywords: RelatedKeywordData[] = [];
  let apiRequestCount = 0;

  // Fetch uncached keywords from API
  if (uncachedKeywords.length > 0) {
    // Check if DataForSEO is configured
    if (!isDataForSEOConfigured()) {
      // Return cached data only with warning
      if (cachedKeywords.length > 0) {
        warnings.push(
          "DataForSEO not configured. Returning cached data only. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD."
        );
        return {
          success: true,
          data: {
            keywords: cachedKeywords,
            relatedKeywords: [],
            fromCache: cachedKeywords.length,
            fromApi: 0,
          },
          warnings,
        };
      }
      return {
        success: false,
        error: "DataForSEO not configured. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD environment variables.",
      };
    }

    try {
      // Fetch search volume for uncached keywords
      apiKeywords = await getSearchVolume({
        keywords: uncachedKeywords,
        locationCode,
        languageCode,
      });
      apiRequestCount++;

      // Cache the new results
      if (apiKeywords.length > 0) {
        await cacheKeywords(apiKeywords, locationCode, options.cacheTtlDays || DEFAULT_CACHE_TTL_DAYS);
      }
    } catch (error) {
      console.error("DataForSEO API error:", error);
      // If we have cached data, return it with warning
      if (cachedKeywords.length > 0) {
        warnings.push(`Failed to fetch some keywords from API: ${error instanceof Error ? error.message : "Unknown error"}`);
      } else {
        return {
          success: false,
          error: `DataForSEO API error: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    }
  }

  // Fetch related keywords if requested
  if (includeRelated) {
    const seedKeywords = normalizedKeywords.slice(0, 20); // Max 20 for related keywords API

    if (seedKeywords.length > 0) {
      try {
        if (isDataForSEOConfigured()) {
          relatedKeywords = await getRelatedKeywords({
            keywords: seedKeywords,
            locationCode,
            languageCode,
            sortBy: "search_volume",
          });
          apiRequestCount++;

          // Filter out seed keywords from related
          const seedSet = new Set(normalizedKeywords);
          relatedKeywords = relatedKeywords.filter(
            (k) => !seedSet.has(k.keyword.toLowerCase())
          );

          // Cache related keywords too
          if (relatedKeywords.length > 0) {
            await cacheKeywords(
              relatedKeywords as KeywordVolumeData[],
              locationCode,
              options.cacheTtlDays || DEFAULT_CACHE_TTL_DAYS
            );
          }
        }
      } catch (error) {
        console.error("Failed to fetch related keywords:", error);
        warnings.push("Failed to fetch related keywords");
      }
    }
  }

  // Combine cached and API results
  const allKeywords = [...cachedKeywords, ...apiKeywords];

  // Log SEO usage
  if (apiRequestCount > 0) {
    const estimatedCost = estimateCost("search_volume", apiRequestCount);

    await supabase.from("seo_usage_log").insert({
      team_id: options.teamId,
      article_id: options.articleId || null,
      brand_id: options.brandId || null,
      operation: "keyword_research",
      request_count: apiRequestCount,
      estimated_cost: estimatedCost,
    });
  }

  // Save to keyword_research table if article is specified
  if (options.articleId && allKeywords.length > 0) {
    const keywordEntries = allKeywords.map((kw) => ({
      team_id: options.teamId,
      article_id: options.articleId,
      keyword: kw.keyword,
      search_volume: kw.searchVolume,
      competition: kw.competition,
      competition_level: kw.competitionLevel,
      cpc: kw.cpc,
      location_code: locationCode,
      language_code: languageCode,
      fetched_at: new Date().toISOString(),
      related_keywords: relatedKeywords.length > 0
        ? (relatedKeywords.slice(0, 20) as unknown as Json)
        : null,
    }));

    // Upsert to avoid duplicates
    for (const entry of keywordEntries) {
      await supabase.from("keyword_research").upsert(entry, {
        onConflict: "team_id,keyword",
      });
    }

    // Revalidate article SEO page
    revalidatePath(`/articles/${options.articleId}/seo`);
  }

  return {
    success: true,
    data: {
      keywords: allKeywords,
      relatedKeywords,
      fromCache: cachedKeywords.length,
      fromApi: apiKeywords.length,
    },
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Get saved keyword research for an article
 */
export async function getArticleKeywords(
  articleId: string
): Promise<{ data: SavedKeywordResearch[] | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("keyword_research")
    .select("*")
    .eq("article_id", articleId)
    .order("search_volume", { ascending: false, nullsFirst: false });

  if (error) {
    return { data: null, error: error.message };
  }

  const keywords: SavedKeywordResearch[] = data.map((row) => ({
    id: row.id,
    keyword: row.keyword,
    searchVolume: row.search_volume,
    competition: row.competition,
    competitionLevel: row.competition_level,
    cpc: row.cpc,
    relatedKeywords: row.related_keywords as RelatedKeywordData[] | null,
    fetchedAt: row.fetched_at,
  }));

  return { data: keywords, error: null };
}

/**
 * Delete a keyword from research
 */
export async function deleteKeywordResearch(keywordId: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("keyword_research")
    .delete()
    .eq("id", keywordId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

/**
 * Check if DataForSEO is configured
 */
export async function checkDataForSEOConfig(): Promise<{
  configured: boolean;
  message: string;
}> {
  if (isDataForSEOConfigured()) {
    return {
      configured: true,
      message: "DataForSEO is configured and ready to use",
    };
  }

  return {
    configured: false,
    message: "DataForSEO not configured. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD environment variables.",
  };
}

/**
 * Get SEO usage statistics for a team
 */
export async function getSEOUsageStats(
  teamId: string,
  days: number = 30
): Promise<{
  totalRequests: number;
  totalCost: number;
  byOperation: Record<string, { requests: number; cost: number }>;
}> {
  const supabase = await createClient();

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("seo_usage_log")
    .select("operation, request_count, estimated_cost")
    .eq("team_id", teamId)
    .gte("created_at", since.toISOString());

  if (error || !data) {
    return {
      totalRequests: 0,
      totalCost: 0,
      byOperation: {},
    };
  }

  const byOperation: Record<string, { requests: number; cost: number }> = {};
  let totalRequests = 0;
  let totalCost = 0;

  for (const row of data) {
    totalRequests += row.request_count;
    totalCost += row.estimated_cost || 0;

    if (!byOperation[row.operation]) {
      byOperation[row.operation] = { requests: 0, cost: 0 };
    }
    byOperation[row.operation].requests += row.request_count;
    byOperation[row.operation].cost += row.estimated_cost || 0;
  }

  return {
    totalRequests,
    totalCost,
    byOperation,
  };
}
