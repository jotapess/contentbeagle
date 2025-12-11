/**
 * Humanization Prompts
 *
 * Prompts for removing AI-generated content patterns and making
 * content sound more natural and human-written.
 */

import type { PatternMatch } from '../pattern-detector';
import type { BrandVoice } from './content-generation';

export interface HumanizationInput {
  content: string;
  matches: PatternMatch[];
  brandVoice?: BrandVoice;
  brandName?: string;
  preserveStructure?: boolean; // Keep headings and overall structure
}

/**
 * Build system prompt for humanization
 */
export function buildHumanizationSystemPrompt(input: HumanizationInput): string {
  const { brandVoice, brandName, preserveStructure = true } = input;

  let systemPrompt = `You are an expert editor specializing in making AI-generated content sound more natural and human-written. Your goal is to remove telltale AI patterns while preserving the content's meaning and quality.`;

  if (brandName) {
    systemPrompt += `\n\nYou are editing content for ${brandName}.`;
  }

  // Brand voice characteristics
  if (brandVoice) {
    systemPrompt += `\n\n## Brand Voice Guidelines`;

    if (brandVoice.tone) {
      systemPrompt += `\n- Maintain tone: ${brandVoice.tone}`;
    }

    if (brandVoice.formality !== undefined) {
      const formalityDesc =
        brandVoice.formality >= 7
          ? 'formal and professional'
          : brandVoice.formality >= 4
          ? 'conversational yet professional'
          : 'casual and friendly';
      systemPrompt += `\n- Formality level: ${formalityDesc}`;
    }

    if (brandVoice.vocabulary && brandVoice.vocabulary.length > 0) {
      systemPrompt += `\n- Preferred vocabulary: ${brandVoice.vocabulary.join(', ')}`;
    }

    if (brandVoice.avoidTerms && brandVoice.avoidTerms.length > 0) {
      systemPrompt += `\n- Terms to avoid: ${brandVoice.avoidTerms.join(', ')}`;
    }
  }

  systemPrompt += `\n\n## Editing Guidelines

### What to Change:
- Replace overused AI words (delve, robust, leverage, streamline, realm, landscape, tapestry)
- Remove or rephrase formal transitions (moreover, furthermore, crucially, in conclusion)
- Eliminate filler phrases (it's important to note, at the end of the day, it goes without saying)
- Fix repetitive sentence structures
- Vary sentence lengths and rhythms
- Use more specific, concrete language instead of generic terms

### What to Preserve:
${preserveStructure ? '- Keep the overall structure and headings intact' : '- Feel free to reorganize content for better flow'}
- Maintain the core message and factual content
- Preserve technical terms that are appropriate for the topic
- Keep any quotes or citations exactly as they are

### Style Tips:
- Start some sentences with "And" or "But" for natural flow
- Use contractions where appropriate (we're, it's, don't)
- Include occasional personal touches or asides
- Vary your transitions between sections
- Don't over-explain; trust the reader

## Output Format
Return ONLY the rewritten content in the same format (Markdown) as the input. Do not include any explanations, comments, or meta-text about what you changed.`;

  return systemPrompt;
}

/**
 * Build user prompt for full content humanization
 */
export function buildHumanizationUserPrompt(input: HumanizationInput): string {
  const { content, matches } = input;

  let userPrompt = `Please humanize the following content by removing AI-generated patterns while maintaining the meaning and quality.`;

  if (matches.length > 0) {
    // Group matches by category
    const byCategory = new Map<string, string[]>();
    for (const match of matches) {
      const list = byCategory.get(match.category) || [];
      if (!list.includes(match.matchedText.toLowerCase())) {
        list.push(match.matchedText.toLowerCase());
      }
      byCategory.set(match.category, list);
    }

    userPrompt += `\n\n## Detected AI Patterns to Address:`;

    for (const [category, texts] of byCategory) {
      const categoryName = category.replace(/_/g, ' ');
      userPrompt += `\n- ${categoryName}: "${texts.slice(0, 5).join('", "')}"${texts.length > 5 ? ` (and ${texts.length - 5} more)` : ''}`;
    }
  }

  userPrompt += `\n\n## Content to Humanize:\n\n${content}`;

  return userPrompt;
}

/**
 * Build prompt for fixing a single pattern occurrence
 */
export function buildSingleFixPrompt(
  originalText: string,
  match: PatternMatch,
  context: { before: string; after: string },
  brandVoice?: BrandVoice
): { systemPrompt: string; userPrompt: string } {
  let systemPrompt = `You are an expert editor. Your task is to suggest a replacement for a detected AI pattern. Provide a natural-sounding alternative that fits the context.`;

  if (brandVoice?.tone) {
    systemPrompt += `\n\nMaintain a ${brandVoice.tone} tone.`;
  }

  systemPrompt += `\n\n## Rules:
- Return ONLY the replacement text, nothing else
- Match the grammatical structure of the original
- Keep the same meaning
- Make it sound natural and human-written
- If the pattern can simply be removed, return an empty response`;

  const userPrompt = `Pattern: "${match.matchedText}"
Category: ${match.ruleName}
${match.replacementOptions.length > 0 ? `Suggested alternatives: ${match.replacementOptions.join(', ')}` : ''}

Context:
"...${context.before}[${match.matchedText}]${context.after}..."

What would be a better, more natural way to express this?`;

  return { systemPrompt, userPrompt };
}

/**
 * Build prompt for batch fixes (multiple specific patterns)
 */
export function buildBatchFixPrompt(
  content: string,
  matches: PatternMatch[],
  brandVoice?: BrandVoice
): { systemPrompt: string; userPrompt: string } {
  let systemPrompt = `You are an expert editor. Your task is to replace specific AI-generated patterns in the content with more natural alternatives.

## Rules:
- Replace ONLY the marked patterns, not other content
- Keep replacements contextually appropriate
- Maintain grammatical correctness
- Return the FULL content with replacements made
- Do not add any explanations or comments`;

  if (brandVoice?.tone) {
    systemPrompt += `\n\nMaintain a ${brandVoice.tone} tone throughout.`;
  }

  // Create a marked version of the content
  let markedContent = content;
  const sortedMatches = [...matches].sort(
    (a, b) => b.location.start - a.location.start
  );

  // Mark patterns from end to start to preserve positions
  let markerIndex = sortedMatches.length;
  for (const match of sortedMatches) {
    const marker = `[PATTERN_${markerIndex}]`;
    markedContent =
      markedContent.slice(0, match.location.start) +
      marker +
      markedContent.slice(match.location.end);
    markerIndex--;
  }

  let userPrompt = `Please replace the marked patterns in the following content with more natural alternatives:\n\n`;

  // List patterns to replace
  userPrompt += `## Patterns to Replace:\n`;
  sortedMatches.reverse().forEach((match, i) => {
    const options = match.replacementOptions.length > 0
      ? ` (suggestions: ${match.replacementOptions.join(', ')})`
      : '';
    userPrompt += `[PATTERN_${i + 1}]: "${match.matchedText}" - ${match.ruleName}${options}\n`;
  });

  userPrompt += `\n## Content:\n\n${markedContent}`;

  return { systemPrompt, userPrompt };
}

/**
 * Build complete humanization prompt
 */
export function buildHumanizationPrompt(input: HumanizationInput): {
  systemPrompt: string;
  userPrompt: string;
} {
  return {
    systemPrompt: buildHumanizationSystemPrompt(input),
    userPrompt: buildHumanizationUserPrompt(input),
  };
}
