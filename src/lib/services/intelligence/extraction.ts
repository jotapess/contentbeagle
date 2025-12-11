/**
 * Intelligence Extraction Service
 *
 * Extracts keywords and topics from crawled page content using AI.
 * Designed to be called after Firecrawl completes crawling a brand's website.
 */

import { generateObject } from "ai";
import { z } from "zod";
import type { LanguageModel } from "ai";

/**
 * Schema for page-level extraction results
 */
export const PageExtractionSchema = z.object({
  keywords: z.array(
    z.object({
      term: z.string().describe("The keyword or key phrase"),
      relevance: z.number().min(0).max(1).describe("Relevance score 0-1"),
      type: z
        .enum(["primary", "secondary", "long-tail"])
        .describe("Keyword type classification"),
    })
  ),
  topics: z.array(z.string()).describe("Main topics covered on this page"),
  contentCategory: z
    .enum([
      "homepage",
      "about",
      "product",
      "service",
      "blog",
      "case-study",
      "pricing",
      "contact",
      "legal",
      "other",
    ])
    .describe("Page content category"),
  primaryTopic: z.string().describe("The single main topic of this page"),
  summary: z.string().describe("Brief summary of page content (1-2 sentences)"),
});

export type PageExtraction = z.infer<typeof PageExtractionSchema>;

/**
 * Schema for brand voice extraction
 */
export const BrandVoiceSchema = z.object({
  tone: z
    .enum(["professional", "casual", "friendly", "authoritative", "playful", "technical"])
    .describe("Overall tone of the brand"),
  style: z
    .enum(["formal", "conversational", "educational", "promotional", "storytelling"])
    .describe("Writing style"),
  vocabularyLevel: z
    .enum(["simple", "moderate", "advanced", "technical"])
    .describe("Complexity of vocabulary used"),
  keyPhrases: z.array(z.string()).describe("Distinctive phrases the brand uses"),
  voiceDescription: z.string().describe("Brief description of the brand voice"),
});

export type BrandVoice = z.infer<typeof BrandVoiceSchema>;

/**
 * System prompt for page intelligence extraction
 */
function buildExtractionSystemPrompt(): string {
  return `You are an SEO expert and content analyst specializing in extracting actionable intelligence from web content.

Your task is to analyze a single web page and extract:
1. **Keywords**: SEO-relevant keywords that represent what this page is about
   - Primary keywords: Main terms the page targets (2-4 keywords)
   - Secondary keywords: Supporting terms (3-5 keywords)
   - Long-tail keywords: Specific phrases (3-5 phrases)
   - Assign relevance scores based on how central each keyword is to the content

2. **Topics**: The main themes and subjects covered on the page (3-5 topics)

3. **Content Category**: Classify the page type (homepage, about, product, service, blog, etc.)

4. **Primary Topic**: The single most important topic of this page

5. **Summary**: A 1-2 sentence description of what this page is about

## Guidelines
- Focus on SEO-relevant terms, not generic words
- Consider search intent - what would someone search to find this page?
- Exclude brand names from keywords unless they're product names
- Extract terms that would be valuable for content strategy
- Be specific rather than generic (e.g., "payment processing API" not "technology")`;
}

/**
 * System prompt for brand voice extraction
 */
function buildVoiceExtractionSystemPrompt(): string {
  return `You are a brand strategist analyzing content to understand a company's voice and communication style.

Analyze the provided content samples and determine:
1. **Tone**: The emotional quality of the writing
2. **Style**: The approach to communicating with readers
3. **Vocabulary Level**: How complex the language is
4. **Key Phrases**: Distinctive phrases or expressions the brand commonly uses
5. **Voice Description**: A brief summary of how this brand sounds

Base your analysis only on evidence in the provided content.`;
}

/**
 * Extract intelligence from a single page's content
 */
export async function extractPageIntelligence(
  content: string,
  pageUrl: string,
  pageTitle: string | null,
  model: LanguageModel
): Promise<PageExtraction> {
  // Truncate content if too long (keep first 8000 chars for context)
  const truncatedContent = content.length > 8000 ? content.slice(0, 8000) + "\n\n[Content truncated...]" : content;

  const userPrompt = `Analyze this web page and extract SEO intelligence:

**URL**: ${pageUrl}
**Title**: ${pageTitle || "Untitled"}

**Content**:
${truncatedContent}

Return a JSON object with keywords, topics, contentCategory, primaryTopic, and summary.`;

  const result = await generateObject({
    model,
    schema: PageExtractionSchema,
    system: buildExtractionSystemPrompt(),
    prompt: userPrompt,
  });

  return result.object;
}

/**
 * Extract brand voice from multiple page samples
 */
export async function extractBrandVoice(
  pageContents: Array<{ url: string; title: string | null; content: string }>,
  brandName: string,
  model: LanguageModel
): Promise<BrandVoice> {
  // Sample content from multiple pages
  const contentSamples = pageContents
    .slice(0, 5) // Use up to 5 pages
    .map((page, i) => {
      const truncated = page.content.slice(0, 2000);
      return `### Page ${i + 1}: ${page.title || page.url}
${truncated}${page.content.length > 2000 ? "\n[truncated]" : ""}`;
    })
    .join("\n\n---\n\n");

  const userPrompt = `Analyze the brand voice for "${brandName}" based on these content samples:

${contentSamples}

Determine the brand's tone, style, vocabulary level, key phrases, and provide a voice description.`;

  const result = await generateObject({
    model,
    schema: BrandVoiceSchema,
    system: buildVoiceExtractionSystemPrompt(),
    prompt: userPrompt,
  });

  return result.object;
}

/**
 * Batch extract intelligence from multiple pages
 * Returns results as they complete for progress tracking
 */
export async function batchExtractPageIntelligence(
  pages: Array<{ id: string; url: string; title: string | null; content: string }>,
  model: LanguageModel,
  onProgress?: (completed: number, total: number) => void
): Promise<Map<string, PageExtraction>> {
  const results = new Map<string, PageExtraction>();
  const total = pages.length;
  let completed = 0;

  // Process pages in parallel batches of 3 to avoid rate limits
  const batchSize = 3;

  for (let i = 0; i < pages.length; i += batchSize) {
    const batch = pages.slice(i, i + batchSize);

    const batchResults = await Promise.allSettled(
      batch.map(async (page) => {
        const extraction = await extractPageIntelligence(
          page.content,
          page.url,
          page.title,
          model
        );
        return { id: page.id, extraction };
      })
    );

    for (const result of batchResults) {
      completed++;
      if (result.status === "fulfilled") {
        results.set(result.value.id, result.value.extraction);
      } else {
        console.error(`Failed to extract intelligence for page:`, result.reason);
      }
      onProgress?.(completed, total);
    }
  }

  return results;
}
