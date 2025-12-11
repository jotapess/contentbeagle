/**
 * Keyword Cache Layer
 *
 * Caches keyword research data in Supabase to minimize DataForSEO API calls.
 * Uses the keyword_cache table with configurable TTL (default 30 days).
 */

import { createClient } from "@/lib/supabase/server";
import type { KeywordVolumeData } from "@/lib/services/dataforseo";
import type { Json } from "@/types/database";

// Default cache TTL in days
export const DEFAULT_CACHE_TTL_DAYS = 30;

/**
 * Cache entry structure stored in database
 */
interface CachedKeywordData {
  keyword: string;
  searchVolume: number;
  competition: number;
  competitionLevel: string | null;
  cpc: number | null;
  lowTopOfPageBid: number | null;
  highTopOfPageBid: number | null;
  monthlySearches: Array<{
    year: number;
    month: number;
    searchVolume: number;
  }>;
  cachedAt: string;
}

/**
 * Generate cache key for a keyword + location combination
 */
function getCacheKey(keyword: string, locationCode: number): string {
  return `${keyword.toLowerCase().trim()}_${locationCode}`;
}

/**
 * Calculate expiration date based on TTL
 */
function getExpirationDate(ttlDays: number = DEFAULT_CACHE_TTL_DAYS): string {
  const expiration = new Date();
  expiration.setDate(expiration.getDate() + ttlDays);
  return expiration.toISOString();
}

/**
 * Check if cache entry is still valid
 */
function isValidCacheEntry(expiresAt: string): boolean {
  return new Date(expiresAt) > new Date();
}

/**
 * Get cached keyword data
 *
 * @param keyword - The keyword to look up
 * @param locationCode - Location code (default: 2840 for US)
 * @returns Cached data if available and not expired, null otherwise
 */
export async function getCachedKeyword(
  keyword: string,
  locationCode: number = 2840
): Promise<KeywordVolumeData | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("keyword_cache")
    .select("data, expires_at")
    .eq("keyword", keyword.toLowerCase().trim())
    .eq("location_code", locationCode)
    .single();

  if (error || !data) {
    return null;
  }

  // Check if cache is still valid
  if (!isValidCacheEntry(data.expires_at)) {
    // Delete expired entry
    await supabase
      .from("keyword_cache")
      .delete()
      .eq("keyword", keyword.toLowerCase().trim())
      .eq("location_code", locationCode);
    return null;
  }

  const cachedData = data.data as unknown as CachedKeywordData;

  return {
    keyword: cachedData.keyword,
    searchVolume: cachedData.searchVolume,
    competition: cachedData.competition,
    competitionLevel: cachedData.competitionLevel as KeywordVolumeData["competitionLevel"],
    cpc: cachedData.cpc,
    lowTopOfPageBid: cachedData.lowTopOfPageBid,
    highTopOfPageBid: cachedData.highTopOfPageBid,
    monthlySearches: cachedData.monthlySearches,
  };
}

/**
 * Get multiple cached keywords at once
 *
 * @param keywords - Array of keywords to look up
 * @param locationCode - Location code (default: 2840 for US)
 * @returns Object mapping keywords to cached data (null if not cached)
 */
export async function getCachedKeywords(
  keywords: string[],
  locationCode: number = 2840
): Promise<Map<string, KeywordVolumeData | null>> {
  const supabase = await createClient();
  const normalizedKeywords = keywords.map((k) => k.toLowerCase().trim());

  const { data, error } = await supabase
    .from("keyword_cache")
    .select("keyword, data, expires_at")
    .in("keyword", normalizedKeywords)
    .eq("location_code", locationCode);

  const result = new Map<string, KeywordVolumeData | null>();

  // Initialize all keywords as not cached
  for (const keyword of normalizedKeywords) {
    result.set(keyword, null);
  }

  if (error || !data) {
    return result;
  }

  const now = new Date();
  const expiredKeywords: string[] = [];

  for (const entry of data) {
    const expiresAt = new Date(entry.expires_at);
    if (expiresAt <= now) {
      expiredKeywords.push(entry.keyword);
      continue;
    }

    const cachedData = entry.data as unknown as CachedKeywordData;
    result.set(entry.keyword, {
      keyword: cachedData.keyword,
      searchVolume: cachedData.searchVolume,
      competition: cachedData.competition,
      competitionLevel: cachedData.competitionLevel as KeywordVolumeData["competitionLevel"],
      cpc: cachedData.cpc,
      lowTopOfPageBid: cachedData.lowTopOfPageBid,
      highTopOfPageBid: cachedData.highTopOfPageBid,
      monthlySearches: cachedData.monthlySearches,
    });
  }

  // Clean up expired entries
  if (expiredKeywords.length > 0) {
    await supabase
      .from("keyword_cache")
      .delete()
      .in("keyword", expiredKeywords)
      .eq("location_code", locationCode);
  }

  return result;
}

/**
 * Cache keyword data
 *
 * @param keywordData - Keyword data to cache
 * @param locationCode - Location code (default: 2840 for US)
 * @param ttlDays - Cache TTL in days (default: 30)
 */
export async function cacheKeyword(
  keywordData: KeywordVolumeData,
  locationCode: number = 2840,
  ttlDays: number = DEFAULT_CACHE_TTL_DAYS
): Promise<void> {
  const supabase = await createClient();

  const cacheData: CachedKeywordData = {
    keyword: keywordData.keyword,
    searchVolume: keywordData.searchVolume,
    competition: keywordData.competition,
    competitionLevel: keywordData.competitionLevel,
    cpc: keywordData.cpc,
    lowTopOfPageBid: keywordData.lowTopOfPageBid,
    highTopOfPageBid: keywordData.highTopOfPageBid,
    monthlySearches: keywordData.monthlySearches,
    cachedAt: new Date().toISOString(),
  };

  const { error } = await supabase.from("keyword_cache").upsert(
    {
      keyword: keywordData.keyword.toLowerCase().trim(),
      location_code: locationCode,
      data: cacheData as unknown as Json,
      expires_at: getExpirationDate(ttlDays),
    },
    {
      onConflict: "keyword,location_code",
    }
  );

  if (error) {
    console.error("Failed to cache keyword:", error);
  }
}

/**
 * Cache multiple keywords at once
 *
 * @param keywordsData - Array of keyword data to cache
 * @param locationCode - Location code (default: 2840 for US)
 * @param ttlDays - Cache TTL in days (default: 30)
 */
export async function cacheKeywords(
  keywordsData: KeywordVolumeData[],
  locationCode: number = 2840,
  ttlDays: number = DEFAULT_CACHE_TTL_DAYS
): Promise<void> {
  const supabase = await createClient();
  const expiresAt = getExpirationDate(ttlDays);
  const now = new Date().toISOString();

  const cacheEntries = keywordsData.map((keywordData) => ({
    keyword: keywordData.keyword.toLowerCase().trim(),
    location_code: locationCode,
    data: {
      keyword: keywordData.keyword,
      searchVolume: keywordData.searchVolume,
      competition: keywordData.competition,
      competitionLevel: keywordData.competitionLevel,
      cpc: keywordData.cpc,
      lowTopOfPageBid: keywordData.lowTopOfPageBid,
      highTopOfPageBid: keywordData.highTopOfPageBid,
      monthlySearches: keywordData.monthlySearches,
      cachedAt: now,
    } as unknown as Json,
    expires_at: expiresAt,
  }));

  const { error } = await supabase.from("keyword_cache").upsert(cacheEntries, {
    onConflict: "keyword,location_code",
  });

  if (error) {
    console.error("Failed to cache keywords:", error);
  }
}

/**
 * Clear expired cache entries
 * Should be called periodically (e.g., via cron job)
 */
export async function clearExpiredCache(): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("keyword_cache")
    .delete()
    .lt("expires_at", new Date().toISOString())
    .select("id");

  if (error) {
    console.error("Failed to clear expired cache:", error);
    return 0;
  }

  return data?.length || 0;
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalEntries: number;
  expiredEntries: number;
}> {
  const supabase = await createClient();

  const { count: totalCount } = await supabase
    .from("keyword_cache")
    .select("*", { count: "exact", head: true });

  const { count: expiredCount } = await supabase
    .from("keyword_cache")
    .select("*", { count: "exact", head: true })
    .lt("expires_at", new Date().toISOString());

  return {
    totalEntries: totalCount || 0,
    expiredEntries: expiredCount || 0,
  };
}
