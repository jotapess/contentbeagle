// Teams
export {
  getUserTeams,
  getTeam,
  getTeamMembers,
  createTeam,
  updateTeam,
  deleteTeam,
  updateMemberRole,
  removeMember,
  getOrCreateDefaultTeam,
} from "./teams";

export type { Team, TeamMember } from "./teams";

// Brands
export {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
  getBrandProfile,
  updateBrandProfile,
  getCrawledPages,
  updateBrandStatus,
} from "./brands";

export type { Brand, BrandProfile, BrandWithProfile } from "./brands";

// Articles
export {
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  updateArticleContent,
  transitionArticleStatus,
  getArticleVersions,
  getArticleWorkflowLog,
  deleteArticle,
  restoreArticleVersion,
} from "./articles";

export type { Article, ArticleVersion, ArticleStatus, ArticleWithBrand } from "./articles";

// Profile
export {
  getProfile,
  updateProfile,
  setDefaultTeam,
  updatePreferences,
} from "./profile";

export type { Profile } from "./profile";

// API Keys
export {
  getAPIKeys,
  storeAPIKeySimple,
  deleteAPIKey,
  toggleAPIKeyStatus,
  getDecryptedAPIKeys,
  updateKeyLastUsed,
  getAvailableProviders,
} from "./api-keys";

export type { UserAPIKey } from "./api-keys";

// Constants
export { PROVIDER_MAP } from "../constants";

// AI Usage
export {
  trackAIUsage,
  getTeamUsage,
  getArticleUsage,
  estimateCost,
} from "./ai-usage";

export type { AIUsageLog, UsageData } from "./ai-usage";

// AI Rules
export {
  getGlobalAIRules,
  getTeamAIRules,
  getActiveRulesForTeam,
  getCombinedRulesForDisplay,
  toggleRuleActive,
  createTeamAIRule,
  updateTeamAIRule,
  deleteTeamAIRule,
  getAIRule,
} from "./ai-rules";

export type { GlobalAIRule, TeamAIRule, CombinedRule } from "./ai-rules";

// Crawl
export {
  createCrawlJob,
  getCrawlJobs,
  getCrawlJob,
  cancelCrawlJob,
  getCrawledPages as getCrawledPagesAction,
  getCrawledPage,
  deleteCrawledPage,
  scrapeSingleUrl,
  discoverUrls,
  startBrandDiscovery,
  checkFirecrawlConfig,
} from "./crawl";

// Brand Analysis
export {
  analyzeBrandVoice,
  canAnalyzeBrand,
} from "./analyze-brand";

export type { AnalyzeBrandResult } from "./analyze-brand";

// Keyword Research
export {
  researchKeywords,
  getArticleKeywords,
  deleteKeywordResearch,
  checkDataForSEOConfig,
  getSEOUsageStats,
} from "./research-keywords";

export type { KeywordResearchResult, SavedKeywordResearch } from "./research-keywords";

// Cross-Linking
export {
  getArticleLinkSuggestions,
  applyLinkToArticle,
  removeAppliedLink,
  getAppliedLinks,
  canSuggestLinks,
} from "./suggest-links";

export type { AppliedLink, LinkSuggestionResult } from "./suggest-links";
