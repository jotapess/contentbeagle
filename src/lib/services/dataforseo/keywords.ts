/**
 * DataForSEO Keywords Service
 *
 * Provides keyword research functionality including:
 * - Search volume lookup
 * - Related keyword suggestions
 */

import { makeRequest, type DataForSEOConfig } from "./client";

// Default location: United States
export const DEFAULT_LOCATION_CODE = 2840;
// Default language: English
export const DEFAULT_LANGUAGE_CODE = "en";

/**
 * Keyword data from search volume API
 */
export interface KeywordVolumeData {
  keyword: string;
  searchVolume: number;
  competition: number; // 0-100
  competitionLevel: "HIGH" | "MEDIUM" | "LOW" | null;
  cpc: number | null;
  lowTopOfPageBid: number | null;
  highTopOfPageBid: number | null;
  monthlySearches: Array<{
    year: number;
    month: number;
    searchVolume: number;
  }>;
}

/**
 * Related keyword data
 */
export interface RelatedKeywordData extends KeywordVolumeData {
  relevance: number;
}

/**
 * Search volume request parameters
 */
export interface SearchVolumeRequest {
  keywords: string[];
  locationCode?: number;
  languageCode?: string;
  searchPartners?: boolean;
}

/**
 * Related keywords request parameters
 */
export interface RelatedKeywordsRequest {
  keywords: string[]; // Max 20 keywords
  locationCode?: number;
  languageCode?: string;
  sortBy?: "relevance" | "search_volume" | "competition";
  includeAdultKeywords?: boolean;
}

// API Response types
interface SearchVolumeResult {
  keyword: string;
  spell: string | null;
  location_code: number;
  language_code: string;
  search_partners: boolean;
  keyword_info: {
    se_type: string;
    last_updated_time: string;
    competition: number;
    competition_level: "HIGH" | "MEDIUM" | "LOW" | null;
    cpc: number | null;
    search_volume: number;
    low_top_of_page_bid: number | null;
    high_top_of_page_bid: number | null;
    monthly_searches: Array<{
      year: number;
      month: number;
      search_volume: number;
    }>;
  };
}

interface RelatedKeywordsResult {
  keyword: string;
  location_code: number;
  language_code: string;
  total_count: number;
  seed_keywords: string[];
  items: Array<{
    se_type: string;
    keyword: string;
    location_code: number;
    language_code: string;
    keyword_info: {
      competition: number;
      competition_level: "HIGH" | "MEDIUM" | "LOW" | null;
      cpc: number | null;
      search_volume: number;
      low_top_of_page_bid: number | null;
      high_top_of_page_bid: number | null;
      monthly_searches: Array<{
        year: number;
        month: number;
        search_volume: number;
      }>;
    };
    keyword_properties: {
      se_type: string;
      keyword_difficulty: number;
    };
    relevance: number;
  }>;
}

/**
 * Get search volume data for keywords
 *
 * @param request - Search volume request parameters
 * @param config - Optional DataForSEO credentials
 * @returns Array of keyword volume data
 */
export async function getSearchVolume(
  request: SearchVolumeRequest,
  config?: DataForSEOConfig
): Promise<KeywordVolumeData[]> {
  const { keywords, locationCode, languageCode, searchPartners } = request;

  if (keywords.length === 0) {
    return [];
  }

  if (keywords.length > 1000) {
    throw new Error("Maximum 1000 keywords per request");
  }

  const body = [
    {
      keywords,
      location_code: locationCode || DEFAULT_LOCATION_CODE,
      language_code: languageCode || DEFAULT_LANGUAGE_CODE,
      search_partners: searchPartners ?? false,
    },
  ];

  const response = await makeRequest<SearchVolumeResult>(
    "/keywords_data/google_ads/search_volume/live",
    body,
    config
  );

  const results: KeywordVolumeData[] = [];

  for (const task of response.tasks) {
    if (task.result) {
      for (const item of task.result) {
        // Skip items with missing keyword_info
        if (!item.keyword_info) {
          results.push({
            keyword: item.keyword,
            searchVolume: 0,
            competition: 0,
            competitionLevel: null,
            cpc: null,
            lowTopOfPageBid: null,
            highTopOfPageBid: null,
            monthlySearches: [],
          });
          continue;
        }
        results.push({
          keyword: item.keyword,
          searchVolume: item.keyword_info.search_volume || 0,
          competition: Math.round((item.keyword_info.competition || 0) * 100),
          competitionLevel: item.keyword_info.competition_level,
          cpc: item.keyword_info.cpc,
          lowTopOfPageBid: item.keyword_info.low_top_of_page_bid,
          highTopOfPageBid: item.keyword_info.high_top_of_page_bid,
          monthlySearches: (item.keyword_info.monthly_searches || []).map((m) => ({
            year: m.year,
            month: m.month,
            searchVolume: m.search_volume,
          })),
        });
      }
    }
  }

  return results;
}

/**
 * Get related keywords for seed keywords
 *
 * @param request - Related keywords request parameters
 * @param config - Optional DataForSEO credentials
 * @returns Array of related keyword data
 */
export async function getRelatedKeywords(
  request: RelatedKeywordsRequest,
  config?: DataForSEOConfig
): Promise<RelatedKeywordData[]> {
  const { keywords, locationCode, languageCode, sortBy, includeAdultKeywords } = request;

  if (keywords.length === 0) {
    return [];
  }

  if (keywords.length > 20) {
    throw new Error("Maximum 20 keywords per request for related keywords");
  }

  const body = [
    {
      keywords,
      location_code: locationCode || DEFAULT_LOCATION_CODE,
      language_code: languageCode || DEFAULT_LANGUAGE_CODE,
      sort_by: sortBy || "relevance",
      include_adult_keywords: includeAdultKeywords ?? false,
    },
  ];

  const response = await makeRequest<RelatedKeywordsResult>(
    "/keywords_data/google_ads/keywords_for_keywords/live",
    body,
    config
  );

  const results: RelatedKeywordData[] = [];

  for (const task of response.tasks) {
    if (task.result) {
      for (const result of task.result) {
        for (const item of result.items || []) {
          // Skip items with missing keyword_info
          if (!item.keyword_info) {
            results.push({
              keyword: item.keyword,
              searchVolume: 0,
              competition: 0,
              competitionLevel: null,
              cpc: null,
              lowTopOfPageBid: null,
              highTopOfPageBid: null,
              monthlySearches: [],
              relevance: item.relevance || 0,
            });
            continue;
          }
          results.push({
            keyword: item.keyword,
            searchVolume: item.keyword_info.search_volume || 0,
            competition: Math.round((item.keyword_info.competition || 0) * 100),
            competitionLevel: item.keyword_info.competition_level,
            cpc: item.keyword_info.cpc,
            lowTopOfPageBid: item.keyword_info.low_top_of_page_bid,
            highTopOfPageBid: item.keyword_info.high_top_of_page_bid,
            monthlySearches: (item.keyword_info.monthly_searches || []).map((m) => ({
              year: m.year,
              month: m.month,
              searchVolume: m.search_volume,
            })),
            relevance: item.relevance || 0,
          });
        }
      }
    }
  }

  return results;
}

/**
 * Get keyword opportunities (combined search volume + related)
 *
 * For a given set of seed keywords:
 * 1. Get their search volume
 * 2. Get related keywords
 * 3. Return combined, sorted by search volume
 */
export async function getKeywordOpportunities(
  seedKeywords: string[],
  options: {
    locationCode?: number;
    languageCode?: string;
    maxRelated?: number;
  } = {},
  config?: DataForSEOConfig
): Promise<{
  seedData: KeywordVolumeData[];
  relatedData: RelatedKeywordData[];
  apiCost: number;
}> {
  const { locationCode, languageCode, maxRelated = 50 } = options;

  // Get seed keyword data
  const seedData = await getSearchVolume(
    {
      keywords: seedKeywords,
      locationCode,
      languageCode,
    },
    config
  );

  // Get related keywords (limit to 20 seed keywords)
  const seedsForRelated = seedKeywords.slice(0, 20);
  let relatedData: RelatedKeywordData[] = [];

  if (seedsForRelated.length > 0) {
    relatedData = await getRelatedKeywords(
      {
        keywords: seedsForRelated,
        locationCode,
        languageCode,
        sortBy: "search_volume",
      },
      config
    );

    // Filter out duplicates of seed keywords and limit results
    const seedKeywordSet = new Set(seedKeywords.map((k) => k.toLowerCase()));
    relatedData = relatedData
      .filter((k) => !seedKeywordSet.has(k.keyword.toLowerCase()))
      .slice(0, maxRelated);
  }

  // Estimate API cost (2 requests: search volume + related keywords)
  const apiCost = 0.05 + 0.05; // Approximate per-request cost

  return {
    seedData,
    relatedData,
    apiCost,
  };
}
