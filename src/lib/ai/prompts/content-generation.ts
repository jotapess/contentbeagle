/**
 * Content Generation Prompts
 *
 * Brand-aware prompt templates for generating long-form content.
 * Supports 4 input types: bullets, draft, research, topic_only
 */

export type InputType = 'bullets' | 'draft' | 'research' | 'topic_only';
export type ArticleLength = 'short' | 'medium' | 'long';

export interface BrandVoice {
  tone?: string;
  formality?: number; // 1-10 scale
  enthusiasm?: number; // 1-10 scale
  humor?: number; // 1-10 scale
  vocabulary?: string[];
  powerWords?: string[];
  avoidTerms?: string[];
  doList?: string[];
  dontList?: string[];
}

export interface ContentGenerationInput {
  inputType: InputType;
  content: string;
  topic?: string;
  targetAudience?: string;
  articleLength: ArticleLength;
  cta?: string;
  seoKeywords?: string[];
  brandVoice?: BrandVoice;
  brandName?: string;
}

/**
 * Get word count guidance based on article length
 */
export function getLengthGuidance(length: ArticleLength): { min: number; max: number; description: string } {
  switch (length) {
    case 'short':
      return { min: 500, max: 800, description: 'concise, focused article' };
    case 'medium':
      return { min: 1000, max: 1500, description: 'comprehensive article with good depth' };
    case 'long':
      return { min: 2000, max: 3000, description: 'in-depth, authoritative piece' };
    default:
      return { min: 1000, max: 1500, description: 'comprehensive article' };
  }
}

/**
 * Build the system prompt with brand voice injection
 */
export function buildSystemPrompt(input: ContentGenerationInput): string {
  const { brandVoice, brandName, targetAudience, articleLength, seoKeywords } = input;
  const lengthGuide = getLengthGuidance(articleLength);

  let systemPrompt = `You are an expert content writer specializing in creating engaging, brand-aligned long-form content.`;

  // Brand identity
  if (brandName) {
    systemPrompt += `\n\nYou are writing for ${brandName}.`;
  }

  // Target audience
  if (targetAudience) {
    systemPrompt += `\n\n## Target Audience\n${targetAudience}`;
  }

  // Brand voice characteristics
  if (brandVoice) {
    systemPrompt += `\n\n## Brand Voice Guidelines`;

    if (brandVoice.tone) {
      systemPrompt += `\n- Tone: ${brandVoice.tone}`;
    }

    if (brandVoice.formality !== undefined) {
      const formalityDesc = brandVoice.formality >= 7 ? 'formal and professional' :
                           brandVoice.formality >= 4 ? 'conversational yet professional' :
                           'casual and friendly';
      systemPrompt += `\n- Formality: ${formalityDesc} (${brandVoice.formality}/10)`;
    }

    if (brandVoice.enthusiasm !== undefined) {
      const enthusiasmDesc = brandVoice.enthusiasm >= 7 ? 'highly energetic and passionate' :
                            brandVoice.enthusiasm >= 4 ? 'engaged and positive' :
                            'calm and measured';
      systemPrompt += `\n- Energy: ${enthusiasmDesc} (${brandVoice.enthusiasm}/10)`;
    }

    if (brandVoice.humor !== undefined && brandVoice.humor > 3) {
      const humorDesc = brandVoice.humor >= 7 ? 'witty with frequent humor' :
                       'occasional light humor when appropriate';
      systemPrompt += `\n- Humor: ${humorDesc} (${brandVoice.humor}/10)`;
    }

    // Vocabulary preferences
    if (brandVoice.vocabulary && brandVoice.vocabulary.length > 0) {
      systemPrompt += `\n\n### Preferred Vocabulary\nUse these terms when relevant: ${brandVoice.vocabulary.join(', ')}`;
    }

    if (brandVoice.powerWords && brandVoice.powerWords.length > 0) {
      systemPrompt += `\n\n### Power Words\nIncorporate these impactful words: ${brandVoice.powerWords.join(', ')}`;
    }

    if (brandVoice.avoidTerms && brandVoice.avoidTerms.length > 0) {
      systemPrompt += `\n\n### Terms to Avoid\nNever use: ${brandVoice.avoidTerms.join(', ')}`;
    }

    // Do's and Don'ts
    if (brandVoice.doList && brandVoice.doList.length > 0) {
      systemPrompt += `\n\n### Writing Do's`;
      brandVoice.doList.forEach(item => {
        systemPrompt += `\n- ${item}`;
      });
    }

    if (brandVoice.dontList && brandVoice.dontList.length > 0) {
      systemPrompt += `\n\n### Writing Don'ts`;
      brandVoice.dontList.forEach(item => {
        systemPrompt += `\n- ${item}`;
      });
    }
  }

  // SEO guidelines
  if (seoKeywords && seoKeywords.length > 0) {
    systemPrompt += `\n\n## SEO Guidelines
Naturally incorporate these keywords throughout the content:
${seoKeywords.map(k => `- ${k}`).join('\n')}

Place the primary keyword in the first paragraph and H2 headings where natural.`;
  }

  // Output format
  systemPrompt += `\n\n## Output Format
- Write in Markdown format
- Use clear H2 (##) and H3 (###) headings to structure the content
- Include an engaging introduction that hooks the reader
- Target length: ${lengthGuide.min}-${lengthGuide.max} words (${lengthGuide.description})
- End with a strong conclusion`;

  // CTA
  if (input.cta) {
    systemPrompt += `\n- Include this call-to-action near the end: "${input.cta}"`;
  }

  // Quality guidelines
  systemPrompt += `\n\n## Quality Standards
- Write original, engaging content that provides real value
- Use concrete examples and actionable insights
- Maintain consistent voice throughout
- Ensure logical flow between sections
- Avoid generic filler content`;

  return systemPrompt;
}

/**
 * Build the user prompt based on input type
 */
export function buildUserPrompt(input: ContentGenerationInput): string {
  const { inputType, content, topic } = input;

  switch (inputType) {
    case 'bullets':
      return `Create a comprehensive article based on these key points:

${content}

Expand each point into detailed sections while maintaining a cohesive narrative throughout the article.`;

    case 'draft':
      return `Improve and expand this draft into a polished, publication-ready article:

${content}

Enhance the structure, add depth to arguments, improve transitions, and ensure the content is engaging while preserving the original intent and key messages.`;

    case 'research':
      return `Create an informative article synthesizing this research and information:

${content}

Transform this research into an engaging narrative that educates readers while making complex information accessible and actionable.`;

    case 'topic_only':
      return `Write a comprehensive article about: ${topic || content}

Create an engaging, well-structured piece that thoroughly covers this topic, providing valuable insights and practical takeaways for readers.`;

    default:
      return `Create a comprehensive article based on the following:

${content}`;
  }
}

/**
 * Build complete prompt configuration for content generation
 */
export function buildContentGenerationPrompt(input: ContentGenerationInput): {
  systemPrompt: string;
  userPrompt: string;
} {
  return {
    systemPrompt: buildSystemPrompt(input),
    userPrompt: buildUserPrompt(input),
  };
}
