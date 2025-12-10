# ContentBeagle - AI Content Generation Pipeline

## Overview

ContentBeagle uses a multi-stage AI pipeline to generate brand-aligned, humanized long-form content. The system supports multiple AI providers through a BYOK (Bring Your Own Key) architecture using the Vercel AI SDK.

---

## Pipeline Architecture

```
User Input (Ideas/Draft/Research)
         │
         ▼
┌──────────────────┐
│ 1. Input Parser  │  ← Classify input type, extract structure
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 2. Brand Context │  ← Load brand profile, voice, terminology
│    Loader        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 3. SEO Enricher  │  ← Fetch DataForSEO keywords (optional)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 4. Content       │  ← Main LLM generation (streaming)
│    Generator     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 5. AI Pattern    │  ← Rule-based + LLM pattern detection/rewrite
│    Remover       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 6. Cross-Link    │  ← Match content to crawled pages
│    Injector      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 7. Final Polish  │  ← Brand re-verification, consistency check
└────────┬─────────┘
         │
         ▼
   Final Article + Meta
```

---

## Provider Abstraction Layer

### BYOK Architecture

Users provide their own API keys for AI providers. Keys are encrypted and stored in Supabase Vault.

```typescript
// /src/lib/ai/provider-registry.ts

import { experimental_createProviderRegistry as createProviderRegistry } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export interface UserAPIKeys {
  openai?: string;
  anthropic?: string;
  google?: string;
}

export function createUserProviderRegistry(keys: UserAPIKeys) {
  const providers: Record<string, any> = {};

  if (keys.openai) {
    providers.openai = createOpenAI({ apiKey: keys.openai });
  }
  if (keys.anthropic) {
    providers.anthropic = createAnthropic({ apiKey: keys.anthropic });
  }
  if (keys.google) {
    providers.google = createGoogleGenerativeAI({ apiKey: keys.google });
  }

  return createProviderRegistry(providers);
}
```

### Supported Models

| Provider | Model ID | Best For | Max Tokens | Cost/1K |
|----------|----------|----------|------------|---------|
| OpenAI | `openai:gpt-4o` | Long-form, creative | 128K | $0.005 |
| OpenAI | `openai:gpt-4o-mini` | Simple rewrites | 128K | $0.00015 |
| Anthropic | `anthropic:claude-3-5-sonnet-20241022` | Analysis, brand-voice | 200K | $0.003 |
| Anthropic | `anthropic:claude-opus-4-5-20251101` | Complex reasoning | 200K | $0.015 |
| Google | `google:gemini-1.5-pro` | Very long context | 1M | $0.00125 |

### Generation Service Interface

```typescript
// /src/lib/ai/generation-service.ts

import { streamText, generateText } from 'ai';

export interface GenerationRequest {
  prompt: string;
  systemPrompt?: string;
  model: string;           // e.g., 'openai:gpt-4o'
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface GenerationResult {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: string;
}

export class AIGenerationService {
  constructor(
    private registry: ReturnType<typeof createUserProviderRegistry>,
    private defaultModel: string
  ) {}

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const model = this.registry.languageModel(request.model || this.defaultModel);

    const result = await generateText({
      model,
      prompt: request.prompt,
      system: request.systemPrompt,
      maxTokens: request.maxTokens,
      temperature: request.temperature ?? 0.7,
    });

    return {
      content: result.text,
      usage: result.usage,
      model: request.model,
      finishReason: result.finishReason,
    };
  }

  async *streamGenerate(request: GenerationRequest): AsyncGenerator<string> {
    const model = this.registry.languageModel(request.model || this.defaultModel);

    const result = await streamText({
      model,
      prompt: request.prompt,
      system: request.systemPrompt,
      maxTokens: request.maxTokens,
      temperature: request.temperature ?? 0.7,
    });

    for await (const chunk of result.textStream) {
      yield chunk;
    }
  }
}
```

---

## Pipeline Input/Output Types

```typescript
// /src/lib/pipeline/types.ts

export interface PipelineInput {
  // User content input
  inputType: 'bullets' | 'draft' | 'research' | 'topic_only';
  content: string;

  // Target specifications
  targetAudience: string;
  articleLength: 'short' | 'medium' | 'long' | number; // word count
  cta?: string;
  topic: string;

  // Brand context
  brandId: string;
  brandProfileId: string;

  // AI settings
  model: string;  // e.g., 'openai:gpt-4o'

  // SEO settings
  seoKeywords?: string[];
  fetchSeoOpportunities?: boolean;

  // Cross-linking
  enableCrossLinks?: boolean;
  maxCrossLinks?: number;

  // AI pattern removal
  aiPatternRulesEnabled?: boolean;
  customPatternRuleIds?: string[];
}

export interface PipelineOutput {
  content: string;
  contentHtml: string;
  meta: {
    seoTitle: string;
    seoDescription: string;
    focusKeyword?: string;
    secondaryKeywords: string[];
  };
  seoData?: SEOEnrichment;
  crossLinks: CrossLinkSuggestion[];
  patternsRemoved: AIPatternMatch[];
  tokenUsage: TokenUsage;
}

export type PipelineEvent =
  | { type: 'step_start'; step: string }
  | { type: 'step_complete'; step: string; data?: any }
  | { type: 'content_chunk'; chunk: string; step?: string }
  | { type: 'pipeline_complete'; result: PipelineOutput }
  | { type: 'pipeline_error'; error: string };
```

---

## Prompt Templates

### 1. Content Generation Prompt

```typescript
// /src/lib/ai/prompts/content-generation.ts

export function buildContentGenerationPrompt(
  input: PipelineInput,
  brandProfile: BrandProfile,
  seoData?: SEOEnrichment
) {
  const system = `You are a professional content writer specializing in long-form articles.

## Brand Voice Profile
- **Voice**: ${brandProfile.voiceDescription || brandProfile.voiceAdjectives?.join(', ')}
- **Tone**: Formality ${brandProfile.toneFormality}/10, Enthusiasm ${brandProfile.toneEnthusiasm}/10
- **Style**: ${brandProfile.sentenceStructure} sentences, ${brandProfile.vocabularyLevel} vocabulary
- **POV**: ${brandProfile.preferredPov}
- **Target Audience**: ${brandProfile.targetAudience || input.targetAudience}

## Terminology Guidelines
### Words to Use
${brandProfile.powerWords?.join(', ') || 'N/A'}

### Words to Avoid
${brandProfile.avoidWords?.join(', ') || 'N/A'}

## Writing Constraints
1. Write in the brand's voice consistently
2. Use active voice predominantly
3. Vary sentence length for rhythm
4. Include specific examples where relevant
5. Avoid generic filler phrases
6. Natural keyword integration - NEVER force keywords

${seoData ? `## SEO Guidelines
Primary Keywords (use 2-3 times naturally): ${seoData.primaryKeywords?.map(k => k.keyword).join(', ')}
Secondary Keywords (use 1-2 times each): ${seoData.secondaryKeywords?.map(k => k.keyword).join(', ')}
` : ''}

## Output Format
Write the article in Markdown format with:
- H1 title (compelling, not generic)
- H2 section headers (benefit-driven or curiosity-provoking)
- H3 subsection headers where appropriate
- Bullet points for lists
- Bold for emphasis on key terms
- No explicit "Introduction" or "Conclusion" headers`;

  const lengthGuidance = getLengthGuidance(input.articleLength);

  const userPrompts: Record<PipelineInput['inputType'], string> = {
    bullets: `Create a comprehensive article based on these bullet points:

${input.content}

**Topic**: ${input.topic}
**Target Audience**: ${input.targetAudience}
**Target Length**: ${lengthGuidance}
${input.cta ? `**Call to Action**: ${input.cta}` : ''}

Expand each bullet into full sections with examples, context, and practical insights.`,

    draft: `Enhance and expand this draft while maintaining the core message:

${input.content}

**Topic**: ${input.topic}
**Target Audience**: ${input.targetAudience}
**Target Length**: ${lengthGuidance}
${input.cta ? `**Call to Action**: ${input.cta}` : ''}

Improve clarity, add depth, include examples, and ensure brand voice alignment.`,

    research: `Create an article synthesizing this research:

${input.content}

**Topic**: ${input.topic}
**Target Audience**: ${input.targetAudience}
**Target Length**: ${lengthGuidance}
${input.cta ? `**Call to Action**: ${input.cta}` : ''}

Transform the research into engaging, accessible content with clear takeaways.`,

    topic_only: `Write a comprehensive article on: ${input.topic}

**Target Audience**: ${input.targetAudience}
**Target Length**: ${lengthGuidance}
${input.cta ? `**Call to Action**: ${input.cta}` : ''}

Cover key aspects comprehensively with practical examples and actionable insights.`,
  };

  return { system, user: userPrompts[input.inputType] };
}

function getLengthGuidance(length: 'short' | 'medium' | 'long' | number): string {
  if (typeof length === 'number') return `approximately ${length} words`;
  return {
    short: '800-1200 words (concise, focused)',
    medium: '1500-2500 words (thorough coverage)',
    long: '3000-5000 words (comprehensive deep-dive)',
  }[length];
}
```

### 2. AI Pattern Removal Prompt

```typescript
// /src/lib/ai/prompts/ai-pattern-removal.ts

export interface AIPatternRule {
  id: string;
  name: string;
  pattern: string;
  patternType: 'regex' | 'exact' | 'semantic';
  replacementOptions: string[];
  severity: 'low' | 'medium' | 'high';
}

export function buildAIPatternRemovalPrompt(
  content: string,
  brandProfile: BrandProfile,
  enabledRules: AIPatternRule[]
) {
  const system = `You are an expert editor specializing in making AI-generated content sound authentically human while maintaining the brand voice.

## Your Task
Review the content and rewrite sections that exhibit AI-typical patterns. Preserve the meaning and information while making it sound more natural and human.

## Brand Voice to Maintain
- Voice: ${brandProfile.voiceDescription}
- Tone: Formality ${brandProfile.toneFormality}/10

## Patterns to Address
${enabledRules.map(r => `- **${r.name}** (${r.severity}): Pattern "${r.pattern}"${r.replacementOptions.length ? ` → Consider: ${r.replacementOptions.join(', ')}` : ''}`).join('\n')}

## Rewriting Guidelines
1. Vary sentence structure - mix short and long sentences
2. Use conversational transitions instead of formal ones
3. Replace generic examples with specific, relatable ones
4. Add subtle personality where appropriate
5. Maintain technical accuracy
6. Keep the same overall structure and sections
7. Do NOT add meta-commentary about the rewriting process

## Output Format
Return the rewritten content in the same Markdown format. After the content, provide a JSON summary:

\`\`\`json
{
  "patternsFound": [
    {"patternId": "pattern_id", "count": number, "examples": ["original text..."]}
  ],
  "totalChanges": number
}
\`\`\``;

  const user = `Please review and humanize this content:

${content}

Focus on making it sound authentically written by a human expert while preserving all information.`;

  return { system, user };
}
```

### 3. SEO Enhancement Prompt

```typescript
// /src/lib/ai/prompts/seo-enhancement.ts

export function buildSEOEnhancementPrompt(
  content: string,
  seoData: SEOEnrichment,
  brandProfile: BrandProfile
) {
  const system = `You are an SEO specialist who enhances content for search visibility while maintaining readability and brand voice.

## SEO Data
**Primary Keywords** (search volume, competition):
${seoData.primaryKeywords.map(k => `- "${k.keyword}" - ${k.searchVolume}/mo, ${k.competition}`).join('\n')}

**Secondary/Long-tail Keywords**:
${seoData.secondaryKeywords.map(k => `- "${k.keyword}" - ${k.searchVolume}/mo`).join('\n')}

**LSI Keywords**:
${seoData.lsiKeywords?.join(', ') || 'N/A'}

## SEO Guidelines
1. Primary keywords: 2-3 natural occurrences, including H1/H2 where natural
2. Secondary keywords: 1-2 occurrences each
3. LSI keywords: sprinkle throughout for topic coverage
4. NEVER keyword stuff - readability is paramount
5. Ensure keywords appear in first 100 words where natural
6. Use keywords in at least one H2 header

## Brand Voice
Maintain ${brandProfile.voiceDescription} throughout.

## Output Format
Return:
1. The enhanced article (same Markdown format)
2. Meta title options (2-3, 50-60 chars each)
3. Meta description options (2-3, 150-160 chars each)
4. Keyword placement summary as JSON`;

  const user = `Enhance this content for SEO while maintaining natural readability:

${content}`;

  return { system, user };
}
```

### 4. Cross-Linking Prompt

```typescript
// /src/lib/ai/prompts/cross-linking.ts

export interface CrawledPageSummary {
  url: string;
  title: string;
  summary: string;
  keyTopics: string[];
}

export function buildCrossLinkingPrompt(
  content: string,
  availablePages: CrawledPageSummary[],
  maxLinks: number
) {
  const system = `You are a content strategist who creates natural internal links to improve site navigation and SEO.

## Available Pages for Linking
${availablePages.map(p => `
**${p.title}**
URL: ${p.url}
Summary: ${p.summary}
Topics: ${p.keyTopics.join(', ')}
`).join('\n---\n')}

## Linking Guidelines
1. Maximum ${maxLinks} internal links
2. Link only where contextually relevant
3. Use natural anchor text (2-6 words)
4. Avoid linking the same page twice
5. Distribute links throughout the content
6. Don't link in headings
7. Prefer linking from informational phrases, not CTAs
8. Ensure linked text flows naturally in the sentence

## Output Format
Return the content with Markdown links inserted: [anchor text](url)

Then provide a JSON summary:
\`\`\`json
{
  "linksAdded": [
    {"url": "...", "anchorText": "...", "context": "surrounding sentence..."}
  ]
}
\`\`\``;

  const user = `Add natural internal links to this content:

${content}`;

  return { system, user };
}
```

### 5. Final Polish Prompt

```typescript
// /src/lib/ai/prompts/final-polish.ts

export function buildFinalPolishPrompt(
  content: string,
  brandProfile: BrandProfile,
  originalInput: PipelineInput
) {
  const system = `You are the final editor ensuring content quality, brand alignment, and consistency.

## Brand Voice Verification
- Voice: ${brandProfile.voiceDescription}
- Tone: Formality ${brandProfile.toneFormality}/10, Enthusiasm ${brandProfile.toneEnthusiasm}/10
- Target Audience: ${originalInput.targetAudience}

## Terminology Check
### Required Terms: ${brandProfile.powerWords?.join(', ') || 'N/A'}
### Forbidden Terms: ${brandProfile.avoidWords?.join(', ') || 'N/A'}

## Final Polish Tasks
1. **Consistency**: Ensure terminology is consistent throughout
2. **Flow**: Verify smooth transitions between sections
3. **Opening**: Strong, engaging first paragraph
4. **Closing**: Clear takeaway or call-to-action
5. **Formatting**: Proper heading hierarchy, paragraph breaks
6. **Brand Alignment**: Verify voice matches brand profile

## Output
Return the polished content. If issues require human review, add HTML comments: <!-- REVIEW: description -->`;

  const user = `Perform final polish on this content:

**Original Topic**: ${originalInput.topic}
**CTA**: ${originalInput.cta || 'None specified'}

**Content**:
${content}`;

  return { system, user };
}
```

---

## Brand Voice Analysis (for Discovery)

```typescript
// /src/lib/ai/brand-extraction.ts

import { z } from 'zod';
import { generateObject } from 'ai';

const BrandVoiceSchema = z.object({
  voiceCharacteristics: z.object({
    formality: z.enum(['very_formal', 'formal', 'neutral', 'casual', 'very_casual']),
    tone: z.array(z.string()),
    personality: z.array(z.string()),
  }),
  writingStyle: z.object({
    sentenceComplexity: z.enum(['simple', 'moderate', 'complex']),
    vocabularyLevel: z.enum(['basic', 'intermediate', 'advanced', 'technical']),
    useOfJargon: z.boolean(),
    commonPhrases: z.array(z.string()),
  }),
  terminology: z.object({
    industryTerms: z.array(z.string()),
    brandSpecificTerms: z.array(z.string()),
    avoidedTerms: z.array(z.string()),
  }),
  targetAudience: z.object({
    primaryAudience: z.string(),
    knowledgeLevel: z.enum(['beginner', 'intermediate', 'expert', 'mixed']),
    painPoints: z.array(z.string()),
  }),
  confidence: z.number().min(0).max(1),
});

export type BrandVoice = z.infer<typeof BrandVoiceSchema>;

export async function extractBrandVoice(
  crawledContent: Array<{ url: string; markdown: string; title?: string }>,
  aiService: AIGenerationService
): Promise<BrandVoice> {
  const contentSamples = crawledContent
    .map(page => `### ${page.title || page.url}\n${page.markdown}`)
    .join('\n\n---\n\n')
    .slice(0, 100000); // Limit context size

  const systemPrompt = `You are an expert brand strategist analyzing content to identify a brand's voice and communication style.

Analyze the provided content samples and identify:
1. Voice Characteristics (formality, tone, personality traits)
2. Writing Style (sentence complexity, vocabulary, jargon usage)
3. Terminology (industry terms, brand-specific terms, avoided terms)
4. Target Audience (who they're writing for, knowledge level, pain points)

Provide your analysis as structured JSON matching the schema.
Include a confidence score (0-1) based on content quantity and consistency.`;

  const result = await generateObject({
    model: aiService.registry.languageModel('openai:gpt-4o'),
    schema: BrandVoiceSchema,
    system: systemPrompt,
    prompt: `Analyze these content samples:\n\n${contentSamples}`,
    temperature: 0.3,
  });

  return result.object;
}
```

---

## Token Estimation

```typescript
// /src/lib/ai/token-estimation.ts

export interface TokenEstimate {
  step: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

const MODEL_COSTS: Record<string, number> = {
  'openai:gpt-4o': 0.005,
  'openai:gpt-4o-mini': 0.00015,
  'anthropic:claude-3-5-sonnet-20241022': 0.003,
  'anthropic:claude-opus-4-5-20251101': 0.015,
  'google:gemini-1.5-pro': 0.00125,
};

export function estimatePipelineTokens(
  input: PipelineInput,
  brandProfile: BrandProfile
): TokenEstimate[] {
  const model = input.model;
  const costPer1k = MODEL_COSTS[model] || 0.01;

  const targetWords = getTargetWordCount(input.articleLength);
  const contentTokens = Math.ceil(targetWords * 1.3); // ~1.3 tokens per word

  const estimates: TokenEstimate[] = [
    {
      step: 'content_generation',
      promptTokens: 2000 + input.content.length / 4,
      completionTokens: contentTokens,
      totalTokens: 0,
      estimatedCost: 0,
    },
    {
      step: 'ai_pattern_removal',
      promptTokens: contentTokens + 500,
      completionTokens: contentTokens,
      totalTokens: 0,
      estimatedCost: 0,
    },
    {
      step: 'final_polish',
      promptTokens: contentTokens + 300,
      completionTokens: contentTokens,
      totalTokens: 0,
      estimatedCost: 0,
    },
  ];

  // Calculate totals
  estimates.forEach(est => {
    est.totalTokens = est.promptTokens + est.completionTokens;
    est.estimatedCost = (est.totalTokens / 1000) * costPer1k;
  });

  return estimates;
}

function getTargetWordCount(length: 'short' | 'medium' | 'long' | number): number {
  if (typeof length === 'number') return length;
  return { short: 1000, medium: 2000, long: 4000 }[length];
}
```

---

## Streaming API Endpoint

```typescript
// /src/app/api/content/generate/route.ts

import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Validate and get user's API keys
  const userKeys = await getUserAPIKeys(req);
  if (!userKeys) {
    return Response.json({ error: 'No API keys configured' }, { status: 400 });
  }

  // Create provider registry
  const registry = createUserProviderRegistry(userKeys);
  const aiService = new AIGenerationService(registry, body.model);

  // Load brand profile
  const brandProfile = await getBrandProfile(body.brandProfileId);

  // Stream response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Step 1: Content Generation
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: 'step_start', step: 'content_generation' })}\n\n`
        ));

        const prompt = buildContentGenerationPrompt(body, brandProfile);
        let content = '';

        for await (const chunk of aiService.streamGenerate({
          prompt: prompt.user,
          systemPrompt: prompt.system,
          model: body.model,
        })) {
          content += chunk;
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'content_chunk', chunk })}\n\n`
          ));
        }

        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: 'step_complete', step: 'content_generation' })}\n\n`
        ));

        // Continue with other steps...
        // (AI pattern removal, cross-linking, final polish)

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`
        ));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

---

## Usage Tracking

```typescript
// /src/lib/ai/usage-tracking.ts

export async function trackAIUsage(
  teamId: string,
  userId: string,
  usage: {
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    feature: string;
    articleId?: string;
    brandId?: string;
  }
) {
  const cost = calculateCost(usage.model, usage.inputTokens, usage.outputTokens);

  await db.aiUsageLog.create({
    data: {
      teamId,
      userId,
      provider: usage.provider,
      model: usage.model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalTokens: usage.inputTokens + usage.outputTokens,
      feature: usage.feature,
      articleId: usage.articleId,
      brandId: usage.brandId,
      estimatedCost: cost,
    },
  });
}
```
