import type { Tables } from "@/types/database";

type BrandProfile = Tables<"brand_profiles">;

export interface ContentGenerationInput {
  inputType: "bullets" | "draft" | "research" | "topic_only";
  content: string;
  topic: string;
  targetAudience: string;
  articleLength: "short" | "medium" | "long" | number;
  cta?: string;
  seoKeywords?: string[];
}

export interface SEOEnrichment {
  primaryKeywords?: Array<{ keyword: string; volume?: number }>;
  secondaryKeywords?: Array<{ keyword: string; volume?: number }>;
}

export function buildContentGenerationPrompt(
  input: ContentGenerationInput,
  brandProfile: BrandProfile | null,
  seoData?: SEOEnrichment
) {
  const voiceDescription = brandProfile?.voice_description || "Professional and clear";
  const voiceAdjectives = brandProfile?.voice_adjectives || [];
  const toneFormality = brandProfile?.tone_formality ?? 5;
  const toneEnthusiasm = brandProfile?.tone_enthusiasm ?? 5;
  const sentenceStructure = brandProfile?.sentence_structure || "varied";
  const vocabularyLevel = brandProfile?.vocabulary_level || "professional";
  const preferredPov = brandProfile?.preferred_pov || "third_person";
  const targetAudience = input.targetAudience;
  const powerWords = brandProfile?.power_words || [];
  const avoidWords = brandProfile?.avoid_words || [];

  const system = `You are a professional content writer specializing in long-form articles.

## Brand Voice Profile
- **Voice**: ${voiceDescription || voiceAdjectives.join(", ")}
- **Tone**: Formality ${toneFormality}/10, Enthusiasm ${toneEnthusiasm}/10
- **Style**: ${sentenceStructure} sentences, ${vocabularyLevel} vocabulary
- **POV**: ${preferredPov.replace("_", " ")}
- **Target Audience**: ${targetAudience}

## Terminology Guidelines
### Words to Use
${powerWords.length > 0 ? powerWords.join(", ") : "N/A"}

### Words to Avoid
${avoidWords.length > 0 ? avoidWords.join(", ") : "N/A"}

## Writing Constraints
1. Write in the brand's voice consistently
2. Use active voice predominantly
3. Vary sentence length for rhythm
4. Include specific examples where relevant
5. Avoid generic filler phrases
6. Natural keyword integration - NEVER force keywords

${seoData ? `## SEO Guidelines
Primary Keywords (use 2-3 times naturally): ${seoData.primaryKeywords?.map((k) => k.keyword).join(", ") || "N/A"}
Secondary Keywords (use 1-2 times each): ${seoData.secondaryKeywords?.map((k) => k.keyword).join(", ") || "N/A"}
` : ""}

## Output Format
Write the article in Markdown format with:
- H1 title (compelling, not generic)
- H2 section headers (benefit-driven or curiosity-provoking)
- H3 subsection headers where appropriate
- Bullet points for lists
- Bold for emphasis on key terms
- No explicit "Introduction" or "Conclusion" headers`;

  const lengthGuidance = getLengthGuidance(input.articleLength);

  const userPrompts: Record<ContentGenerationInput["inputType"], string> = {
    bullets: `Create a comprehensive article based on these bullet points:

${input.content}

**Topic**: ${input.topic}
**Target Audience**: ${input.targetAudience}
**Target Length**: ${lengthGuidance}
${input.cta ? `**Call to Action**: ${input.cta}` : ""}

Expand each bullet into full sections with examples, context, and practical insights.`,

    draft: `Enhance and expand this draft while maintaining the core message:

${input.content}

**Topic**: ${input.topic}
**Target Audience**: ${input.targetAudience}
**Target Length**: ${lengthGuidance}
${input.cta ? `**Call to Action**: ${input.cta}` : ""}

Improve clarity, add depth, include examples, and ensure brand voice alignment.`,

    research: `Create an article synthesizing this research:

${input.content}

**Topic**: ${input.topic}
**Target Audience**: ${input.targetAudience}
**Target Length**: ${lengthGuidance}
${input.cta ? `**Call to Action**: ${input.cta}` : ""}

Transform the research into engaging, accessible content with clear takeaways.`,

    topic_only: `Write a comprehensive article on: ${input.topic}

**Target Audience**: ${input.targetAudience}
**Target Length**: ${lengthGuidance}
${input.cta ? `**Call to Action**: ${input.cta}` : ""}

Cover key aspects comprehensively with practical examples and actionable insights.`,
  };

  return { system, user: userPrompts[input.inputType] };
}

function getLengthGuidance(length: "short" | "medium" | "long" | number): string {
  if (typeof length === "number") return `approximately ${length} words`;
  return {
    short: "800-1200 words (concise, focused)",
    medium: "1500-2500 words (thorough coverage)",
    long: "3000-5000 words (comprehensive deep-dive)",
  }[length];
}

export function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token for English
  return Math.ceil(text.length / 4);
}

export function getTargetWordCount(length: "short" | "medium" | "long" | number): number {
  if (typeof length === "number") return length;
  return {
    short: 1000,
    medium: 2000,
    long: 4000,
  }[length];
}
