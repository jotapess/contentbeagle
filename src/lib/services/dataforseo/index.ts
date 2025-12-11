/**
 * DataForSEO Service
 *
 * SEO data provider for keyword research and search analytics.
 */

export {
  getDataForSEOConfig,
  isDataForSEOConfigured,
  makeRequest,
  estimateCost,
  PRICING_ESTIMATES,
  type DataForSEOConfig,
  type DataForSEOResponse,
  type TaskResult,
} from "./client";

export {
  getSearchVolume,
  getRelatedKeywords,
  getKeywordOpportunities,
  DEFAULT_LOCATION_CODE,
  DEFAULT_LANGUAGE_CODE,
  type KeywordVolumeData,
  type RelatedKeywordData,
  type SearchVolumeRequest,
  type RelatedKeywordsRequest,
} from "./keywords";
