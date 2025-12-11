/**
 * AI Pattern Detection
 *
 * Detects AI-generated content patterns using regex and exact matching.
 * Patterns are loaded from the database (global and team-specific rules).
 */

export interface PatternRule {
  id: string;
  name: string;
  description: string | null;
  category: string;
  pattern_type: 'regex' | 'exact' | 'ai_detection';
  pattern: string | null;
  replacement_options: string[] | null;
  severity: 'low' | 'medium' | 'high';
  is_active: boolean;
}

export interface PatternMatch {
  ruleId: string;
  ruleName: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  matchedText: string;
  replacementOptions: string[];
  location: {
    start: number;
    end: number;
  };
}

export interface DetectionResult {
  matches: PatternMatch[];
  totalMatches: number;
  matchesByCategory: Record<string, number>;
  matchesBySeverity: Record<string, number>;
  aiScore: number; // 0-100 score estimating how AI-like the content is
}

/**
 * Detect patterns in content using the provided rules
 */
export function detectPatterns(content: string, rules: PatternRule[]): DetectionResult {
  const matches: PatternMatch[] = [];
  const activeRules = rules.filter((rule) => rule.is_active && rule.pattern);

  for (const rule of activeRules) {
    if (!rule.pattern) continue;

    try {
      if (rule.pattern_type === 'regex') {
        // Use regex pattern with case-insensitive flag
        const regex = new RegExp(rule.pattern, 'gi');
        let match: RegExpExecArray | null;

        while ((match = regex.exec(content)) !== null) {
          matches.push({
            ruleId: rule.id,
            ruleName: rule.name,
            category: rule.category,
            severity: rule.severity || 'medium',
            matchedText: match[0],
            replacementOptions: rule.replacement_options || [],
            location: {
              start: match.index,
              end: match.index + match[0].length,
            },
          });
        }
      } else if (rule.pattern_type === 'exact') {
        // Case-insensitive exact match
        const searchText = content.toLowerCase();
        const patternText = rule.pattern.toLowerCase();
        let startIndex = 0;

        while ((startIndex = searchText.indexOf(patternText, startIndex)) !== -1) {
          matches.push({
            ruleId: rule.id,
            ruleName: rule.name,
            category: rule.category,
            severity: rule.severity || 'medium',
            matchedText: content.slice(startIndex, startIndex + rule.pattern.length),
            replacementOptions: rule.replacement_options || [],
            location: {
              start: startIndex,
              end: startIndex + rule.pattern.length,
            },
          });
          startIndex += rule.pattern.length;
        }
      }
      // ai_detection type handled by semantic analysis (future)
    } catch (error) {
      console.error(`Error processing pattern rule ${rule.id}:`, error);
    }
  }

  // Sort matches by position (for proper highlighting)
  matches.sort((a, b) => a.location.start - b.location.start);

  // Calculate statistics
  const matchesByCategory: Record<string, number> = {};
  const matchesBySeverity: Record<string, number> = {};

  for (const match of matches) {
    matchesByCategory[match.category] = (matchesByCategory[match.category] || 0) + 1;
    matchesBySeverity[match.severity] = (matchesBySeverity[match.severity] || 0) + 1;
  }

  // Calculate AI score (0-100)
  // Based on: number of matches, severity weight, content length
  const contentWords = content.split(/\s+/).filter(Boolean).length;
  const severityWeights = { low: 1, medium: 2, high: 3 };

  let weightedMatches = 0;
  for (const match of matches) {
    weightedMatches += severityWeights[match.severity] || 1;
  }

  // Normalize: ~5 weighted matches per 1000 words = 50% score
  const normalizedScore = (weightedMatches / Math.max(contentWords, 100)) * 10000;
  const aiScore = Math.min(Math.round(normalizedScore), 100);

  return {
    matches,
    totalMatches: matches.length,
    matchesByCategory,
    matchesBySeverity,
    aiScore,
  };
}

/**
 * Group matches by rule for summary display
 */
export function groupMatchesByRule(matches: PatternMatch[]): Map<string, PatternMatch[]> {
  const grouped = new Map<string, PatternMatch[]>();

  for (const match of matches) {
    const existing = grouped.get(match.ruleId) || [];
    existing.push(match);
    grouped.set(match.ruleId, existing);
  }

  return grouped;
}

/**
 * Apply a single replacement to content
 */
export function applyReplacement(
  content: string,
  match: PatternMatch,
  replacement: string
): string {
  return (
    content.slice(0, match.location.start) +
    replacement +
    content.slice(match.location.end)
  );
}

/**
 * Apply multiple replacements to content (from end to start to preserve positions)
 */
export function applyReplacements(
  content: string,
  replacements: Array<{ match: PatternMatch; replacement: string }>
): string {
  // Sort by position descending to apply from end to start
  const sorted = [...replacements].sort(
    (a, b) => b.match.location.start - a.match.location.start
  );

  let result = content;
  for (const { match, replacement } of sorted) {
    result = applyReplacement(result, match, replacement);
  }

  return result;
}

/**
 * Get non-overlapping matches (for highlighting)
 */
export function getNonOverlappingMatches(matches: PatternMatch[]): PatternMatch[] {
  if (matches.length === 0) return [];

  const sorted = [...matches].sort((a, b) => a.location.start - b.location.start);
  const result: PatternMatch[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = result[result.length - 1];

    // Only add if not overlapping
    if (current.location.start >= last.location.end) {
      result.push(current);
    }
  }

  return result;
}
