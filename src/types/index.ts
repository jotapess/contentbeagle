// Core entity types for ContentBeagle

// ============================================
// User & Team Types
// ============================================

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  defaultTeamId: string | null;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  plan: 'free' | 'pro' | 'enterprise';
  settings: Record<string, unknown>;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joinedAt: string;
  user?: User;
}

// ============================================
// Brand Types
// ============================================

export type BrandStatus = 'pending' | 'crawling' | 'analyzing' | 'ready' | 'error';

export interface Brand {
  id: string;
  teamId: string;
  name: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  description: string | null;
  industry: string | null;
  targetAudience: string | null;
  status: BrandStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrandProfile {
  id: string;
  brandId: string;
  version: number;
  isActive: boolean;

  // Voice characteristics
  voiceAdjectives: string[];
  voiceDescription: string | null;

  // Tone settings (1-10 scales)
  toneFormality: number;
  toneEnthusiasm: number;
  toneHumor: number;
  toneConfidence: number;
  toneEmpathy: number;

  // Style guidelines
  sentenceStructure: 'short' | 'mixed' | 'long';
  vocabularyLevel: 'simple' | 'moderate' | 'advanced' | 'technical';
  paragraphLength: 'short' | 'medium' | 'long';
  preferredPov: 'first_person' | 'second_person' | 'third_person' | 'mixed';

  // Terminology
  keyTerminology: Array<{ term: string; definition: string; context?: string }>;
  powerWords: string[];
  avoidWords: string[];
  brandedPhrases: Array<{ phrase: string; usageContext?: string }>;

  // Content themes
  coreThemes: string[];
  valuePropositions: string[];
  painPointsAddressed: string[];

  // Writing rules
  doList: string[];
  dontList: string[];

  // Sample content
  sampleSentences: Array<{ original: string; context?: string; whyEffective?: string }>;

  // Metadata
  confidenceScore: number | null;
  sourcePagesCount: number;
  createdAt: string;
}

// ============================================
// Crawl Types
// ============================================

export type CrawlJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface CrawlJob {
  id: string;
  brandId: string;
  startedBy: string;
  status: CrawlJobStatus;
  seedUrls: string[];
  maxPages: number;
  pagesCrawled: number;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface CrawledPage {
  id: string;
  brandId: string;
  crawlJobId: string | null;
  url: string;
  canonicalUrl: string | null;
  title: string | null;
  metaDescription: string | null;
  markdownContent: string | null;
  plainText: string | null;
  contentHash: string | null;
  summary: string | null;
  keyTopics: string[];
  targetKeywords: string[];
  contentType: string | null;
  wordCount: number | null;
  readingTimeMinutes: number | null;
  isActive: boolean;
  crawledAt: string;
}

// ============================================
// Article Types
// ============================================

export type ArticleStatus =
  | 'draft'
  | 'editing'
  | 'seo_review'
  | 'cross_linking'
  | 'humanizing'
  | 'polished'
  | 'approved'
  | 'published'
  | 'archived';

export type ArticleInputType = 'bullets' | 'draft' | 'research' | 'topic_only';

export interface Article {
  id: string;
  teamId: string;
  brandId: string;
  title: string;
  slug: string | null;
  excerpt: string | null;
  content: string | null;
  contentHtml: string | null;
  status: ArticleStatus;
  inputType: ArticleInputType | null;
  originalInput: string | null;
  targetAudience: string | null;
  targetLength: string | null;
  callToAction: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  focusKeyword: string | null;
  secondaryKeywords: string[];
  seoScore: number | null;
  suggestedLinks: CrossLinkSuggestion[];
  appliedLinks: CrossLinkSuggestion[];
  humanizationApplied: boolean;
  aiPatternsFound: AIPatternMatch[];
  wordCount: number | null;
  readingTimeMinutes: number | null;
  featuredImageUrl: string | null;
  publishedUrl: string | null;
  publishedAt: string | null;
  createdBy: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  brand?: Brand;
}

export interface ArticleVersion {
  id: string;
  articleId: string;
  versionNumber: number;
  title: string;
  content: string | null;
  status: ArticleStatus;
  changeSummary: string | null;
  changedBy: string;
  createdAt: string;
}

export interface ArticleWorkflowLog {
  id: string;
  articleId: string;
  fromStatus: ArticleStatus | null;
  toStatus: ArticleStatus;
  transitionedBy: string;
  notes: string | null;
  createdAt: string;
}

// ============================================
// Cross-Linking Types
// ============================================

export interface CrossLinkSuggestion {
  url: string;
  anchorText: string;
  context: string;
  relevanceScore: number;
}

// ============================================
// AI Pattern Rule Types
// ============================================

export type PatternCategory =
  | 'phrase_replacement'
  | 'sentence_structure'
  | 'word_variety'
  | 'transition_words'
  | 'punctuation'
  | 'paragraph_flow'
  | 'tone_adjustment'
  | 'custom';

export type PatternType = 'regex' | 'exact' | 'semantic' | 'ai_detection';

export type PatternSeverity = 'low' | 'medium' | 'high';

export interface AIPatternRule {
  id: string;
  teamId?: string;
  globalRuleId?: string;
  name: string;
  description: string | null;
  category: PatternCategory;
  patternType: PatternType;
  pattern: string | null;
  replacement: string | null;
  replacementOptions: string[];
  severity: PatternSeverity;
  isActive: boolean;
  isGlobal: boolean;
  createdBy?: string;
  createdAt: string;
}

export interface AIPatternMatch {
  patternId: string;
  patternName: string;
  count: number;
  examples: string[];
  locations: Array<{ start: number; end: number }>;
}

// ============================================
// API Key Types
// ============================================

export type APIProvider = 'openai' | 'anthropic' | 'google' | 'firecrawl' | 'dataforseo';

export interface UserAPIKey {
  id: string;
  teamId: string;
  providerId: APIProvider;
  config: Record<string, unknown>;
  isActive: boolean;
  lastUsedAt: string | null;
  lastError: string | null;
  createdAt: string;
}

// ============================================
// Usage Types
// ============================================

export interface AIUsageLog {
  id: string;
  teamId: string;
  userId: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  feature: string;
  articleId: string | null;
  brandId: string | null;
  estimatedCost: number;
  createdAt: string;
}

// ============================================
// SEO Types
// ============================================

export interface KeywordData {
  keyword: string;
  searchVolume: number;
  cpc: number;
  competition: number;
  competitionLevel: 'low' | 'medium' | 'high';
}

export interface SEOEnrichment {
  primaryKeywords: KeywordData[];
  secondaryKeywords: KeywordData[];
  lsiKeywords: string[];
  searchIntent: 'informational' | 'navigational' | 'transactional' | 'commercial';
}

// ============================================
// Navigation Types
// ============================================

export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  badge?: string;
  children?: NavItem[];
}
