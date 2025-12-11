/**
 * Brand Extraction Service
 *
 * Extracts brand voice, tone, and style from crawled website content
 * using AI analysis to populate brand_profiles.
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { SUPPORTED_MODELS, type ProviderName, type ModelInfo } from './provider-registry';
import {
  buildBrandVoiceSystemPrompt,
  buildBrandVoiceUserPrompt,
  parseBrandVoiceResponse,
  BrandVoiceAnalysisResult,
} from './prompts/brand-voice-analysis';
import type { TablesInsert, Json } from '@/types/database';

/**
 * Map AI analysis POV values to database-compatible values
 * AI returns: 'first_singular', 'first_plural', 'second', 'third', 'mixed'
 * DB expects: 'first_person', 'second_person', 'third_person', 'mixed'
 */
function mapPovToDatabase(pov: string): 'first_person' | 'second_person' | 'third_person' | 'mixed' {
  switch (pov) {
    case 'first_singular':
    case 'first_plural':
      return 'first_person';
    case 'second':
      return 'second_person';
    case 'third':
      return 'third_person';
    case 'mixed':
    default:
      return 'mixed';
  }
}

/**
 * Map AI sentence structure to database-compatible values
 * AI returns: 'simple', 'complex', 'mixed', 'varied'
 * DB expects: 'short', 'mixed', 'long'
 */
function mapSentenceStructureToDatabase(structure: string): 'short' | 'mixed' | 'long' {
  switch (structure) {
    case 'simple':
      return 'short';
    case 'complex':
      return 'long';
    case 'mixed':
    case 'varied':
    default:
      return 'mixed';
  }
}

/**
 * Map AI vocabulary level to database-compatible values
 * AI returns: 'basic', 'intermediate', 'advanced', 'technical'
 * DB expects: 'simple', 'moderate', 'advanced', 'technical'
 */
function mapVocabularyToDatabase(level: string): 'simple' | 'moderate' | 'advanced' | 'technical' {
  switch (level) {
    case 'basic':
      return 'simple';
    case 'intermediate':
      return 'moderate';
    case 'advanced':
      return 'advanced';
    case 'technical':
      return 'technical';
    default:
      return 'moderate';
  }
}

/**
 * Map AI paragraph length to database-compatible values
 * AI returns: 'short', 'medium', 'long', 'varied'
 * DB expects: 'short', 'medium', 'long'
 */
function mapParagraphLengthToDatabase(length: string): 'short' | 'medium' | 'long' {
  switch (length) {
    case 'short':
      return 'short';
    case 'medium':
      return 'medium';
    case 'long':
      return 'long';
    case 'varied':
    default:
      return 'medium';
  }
}

export interface CrawledPageContent {
  url: string;
  title: string;
  content: string;
}

export interface BrandExtractionInput {
  brandId: string;
  brandName: string;
  industry?: string;
  pages: CrawledPageContent[];
  modelId: string;
  apiKey: string;
}

export interface BrandExtractionResult {
  success: boolean;
  profile?: TablesInsert<'brand_profiles'>;
  analysis?: BrandVoiceAnalysisResult;
  tokensUsed?: {
    input: number;
    output: number;
    total: number;
  };
  error?: string;
}

/**
 * Minimum number of pages recommended for accurate analysis
 */
export const MIN_PAGES_FOR_ANALYSIS = 3;

/**
 * Maximum content length per page to send to AI (characters)
 */
export const MAX_CONTENT_PER_PAGE = 4000;

/**
 * Get provider and model ID from full model string
 */
function parseModelId(fullModelId: string): { provider: ProviderName; modelId: string } {
  const [provider, ...rest] = fullModelId.split(':');
  return {
    provider: provider as ProviderName,
    modelId: rest.join(':'),
  };
}

/**
 * Create model instance from provider and API key
 */
function createModelInstance(fullModelId: string, apiKey: string) {
  const { provider, modelId } = parseModelId(fullModelId);

  switch (provider) {
    case 'openai':
      return createOpenAI({ apiKey })(modelId);
    case 'anthropic':
      return createAnthropic({ apiKey })(modelId);
    case 'google':
      return createGoogleGenerativeAI({ apiKey })(modelId);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Filter and prepare pages for analysis
 * Prioritizes pages with more content and important page types
 */
export function preparePages(pages: CrawledPageContent[], maxPages: number = 10): CrawledPageContent[] {
  // Priority patterns for important pages
  const priorityPatterns = [
    { pattern: /\/(about|company|who-we-are|our-story)/i, weight: 10 },
    { pattern: /\/$/, weight: 9 }, // Homepage
    { pattern: /\/(services?|products?|solutions?)/i, weight: 8 },
    { pattern: /\/(team|people|leadership)/i, weight: 7 },
    { pattern: /\/(values|mission|vision|culture)/i, weight: 9 },
    { pattern: /\/(blog|articles?|resources?)/i, weight: 6 },
    { pattern: /\/(features?|capabilities)/i, weight: 7 },
  ];

  // Score and sort pages
  const scoredPages = pages
    .filter(page => page.content && page.content.trim().length > 100)
    .map(page => {
      let score = 0;

      // Priority based on URL pattern
      for (const { pattern, weight } of priorityPatterns) {
        if (pattern.test(page.url)) {
          score += weight;
          break;
        }
      }

      // Boost for content length (more content = more to analyze)
      const contentLength = page.content.length;
      if (contentLength > 2000) score += 3;
      else if (contentLength > 1000) score += 2;
      else if (contentLength > 500) score += 1;

      return { page, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, maxPages)
    .map(item => ({
      ...item.page,
      content: item.page.content.slice(0, MAX_CONTENT_PER_PAGE),
    }));

  return scoredPages;
}

/**
 * Extract brand voice and style from crawled pages
 */
export async function extractBrandProfile(
  input: BrandExtractionInput
): Promise<BrandExtractionResult> {
  const { brandId, brandName, industry, pages, modelId, apiKey } = input;

  // Validate input
  if (!pages || pages.length === 0) {
    return {
      success: false,
      error: 'No pages provided for analysis',
    };
  }

  // Prepare pages for analysis
  const preparedPages = preparePages(pages);

  if (preparedPages.length < MIN_PAGES_FOR_ANALYSIS) {
    console.warn(`Only ${preparedPages.length} pages available for analysis (recommended: ${MIN_PAGES_FOR_ANALYSIS}+)`);
  }

  try {
    // Get model instance
    const model = createModelInstance(modelId, apiKey);

    // Build prompts
    const systemPrompt = buildBrandVoiceSystemPrompt();
    const userPrompt = buildBrandVoiceUserPrompt({
      brandName,
      industry,
      pageContents: preparedPages,
    });

    // Call AI for analysis
    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: 4000,
      temperature: 0.3, // Lower temperature for more consistent analysis
    });

    // Parse the response
    const analysis = parseBrandVoiceResponse(result.text);

    if (!analysis) {
      return {
        success: false,
        error: 'Failed to parse AI response',
        tokensUsed: {
          input: result.usage?.inputTokens || 0,
          output: result.usage?.outputTokens || 0,
          total: (result.usage?.inputTokens || 0) + (result.usage?.outputTokens || 0),
        },
      };
    }

    // Map analysis result to brand_profiles table schema
    const profile: TablesInsert<'brand_profiles'> = {
      brand_id: brandId,
      is_active: true,
      version: 1,

      // Voice
      voice_description: analysis.voiceDescription,
      voice_adjectives: analysis.voiceAdjectives,

      // Tone scales
      tone_formality: analysis.toneFormality,
      tone_enthusiasm: analysis.toneEnthusiasm,
      tone_humor: analysis.toneHumor,
      tone_confidence: analysis.toneConfidence,
      tone_empathy: analysis.toneEmpathy,

      // Style
      sentence_structure: mapSentenceStructureToDatabase(analysis.sentenceStructure),
      paragraph_length: mapParagraphLengthToDatabase(analysis.paragraphLength),
      vocabulary_level: mapVocabularyToDatabase(analysis.vocabularyLevel),
      preferred_pov: mapPovToDatabase(analysis.preferredPov),

      // Terminology
      power_words: analysis.powerWords,
      avoid_words: analysis.avoidWords,
      key_terminology: analysis.keyTerminology as Json,
      branded_phrases: analysis.brandedPhrases as Json,

      // Content
      core_themes: analysis.coreThemes,
      value_propositions: analysis.valuePropositions,
      pain_points_addressed: analysis.painPointsAddressed,
      sample_sentences: analysis.sampleSentences as Json,

      // Guidelines
      do_list: analysis.doList,
      dont_list: analysis.dontList,

      // Metadata
      source_pages_count: preparedPages.length,
      confidence_score: analysis.confidenceScore,
    };

    return {
      success: true,
      profile,
      analysis,
      tokensUsed: {
        input: result.usage?.inputTokens || 0,
        output: result.usage?.outputTokens || 0,
        total: (result.usage?.inputTokens || 0) + (result.usage?.outputTokens || 0),
      },
    };
  } catch (error) {
    console.error('Brand extraction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during brand extraction',
    };
  }
}

/**
 * Get a suitable model for brand extraction
 * Prefers models with good reasoning capabilities
 */
export function getRecommendedModelForExtraction(): ModelInfo {
  // Prefer GPT-4o or Claude for complex analysis
  const gpt4o = SUPPORTED_MODELS.find(m => m.id === 'openai:gpt-4o');
  const claudeSonnet = SUPPORTED_MODELS.find(m => m.id === 'anthropic:claude-sonnet-4-20250514');
  return gpt4o || claudeSonnet || SUPPORTED_MODELS[0];
}

/**
 * Estimate tokens for brand extraction
 */
export function estimateExtractionTokens(pages: CrawledPageContent[]): number {
  const preparedPages = preparePages(pages);

  // Estimate based on content length
  // Rough estimate: 4 characters per token
  const contentTokens = preparedPages.reduce(
    (sum, page) => sum + Math.ceil(page.content.length / 4),
    0
  );

  // Add system prompt and structure overhead (~2000 tokens)
  const overheadTokens = 2000;

  // Output typically ~1500-2500 tokens
  const expectedOutputTokens = 2000;

  return contentTokens + overheadTokens + expectedOutputTokens;
}
