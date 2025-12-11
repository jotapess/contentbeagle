export {
  createUserProviderRegistry,
  getAvailableModels,
  getDefaultModel,
  SUPPORTED_MODELS,
  type UserAPIKeys,
  type ProviderName,
  type ModelInfo,
} from "./provider-registry";

export {
  AIGenerationService,
  createAIService,
  type GenerationRequest,
  type GenerationResult,
  type StreamGenerationResult,
} from "./generation-service";

export {
  detectPatterns,
  groupMatchesByRule,
  applyReplacement,
  applyReplacements,
  getNonOverlappingMatches,
  type PatternRule,
  type PatternMatch,
  type DetectionResult,
} from "./pattern-detector";

export {
  extractBrandProfile,
  preparePages,
  getRecommendedModelForExtraction,
  estimateExtractionTokens,
  MIN_PAGES_FOR_ANALYSIS,
  MAX_CONTENT_PER_PAGE,
  type CrawledPageContent,
  type BrandExtractionInput,
  type BrandExtractionResult,
} from "./brand-extraction";
