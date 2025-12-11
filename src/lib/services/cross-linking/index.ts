/**
 * Cross-Linking Service
 *
 * Intelligent internal linking suggestions based on content relevance.
 */

export {
  getBrandPages,
  searchPagesByTopics,
  getPageById,
  getPageContent,
  extractTopicsFromContent,
  type IndexedPage,
} from "./page-index";

export {
  calculateRelevanceScore,
  rankPagesByRelevance,
  findBestInsertionPoint,
  type LinkSuggestion,
} from "./relevance-scorer";
