/**
 * Relevance Scorer
 *
 * Calculates relevance scores between article content and indexed pages.
 * Uses topic overlap, TF-IDF-like scoring, and title matching.
 */

import type { IndexedPage } from "./page-index";

/**
 * Link suggestion with relevance score
 */
export interface LinkSuggestion {
  page: IndexedPage;
  relevanceScore: number; // 0-100
  matchedTopics: string[];
  reason: string;
}

/**
 * Scoring weights
 */
const WEIGHTS = {
  topicOverlap: 40, // Max 40 points for topic overlap
  titleMatch: 25, // Max 25 points for title keyword match
  summaryMatch: 20, // Max 20 points for summary keyword match
  contentLength: 15, // Max 15 points based on content length (prefer substantial pages)
};

/**
 * Calculate relevance score between article content and a page
 */
export function calculateRelevanceScore(
  articleTopics: string[],
  articleTitle: string,
  page: IndexedPage
): { score: number; matchedTopics: string[]; reason: string } {
  let totalScore = 0;
  const matchedTopics: string[] = [];
  const reasons: string[] = [];

  // 1. Topic overlap scoring (max 40 points)
  const pageTopicsLower = new Set(page.keyTopics.map((t) => t.toLowerCase()));
  const articleTopicsLower = articleTopics.map((t) => t.toLowerCase());

  for (const topic of articleTopicsLower) {
    if (pageTopicsLower.has(topic)) {
      matchedTopics.push(topic);
    }
  }

  if (matchedTopics.length > 0) {
    // More matches = higher score (diminishing returns)
    const topicScore = Math.min(matchedTopics.length * 10, WEIGHTS.topicOverlap);
    totalScore += topicScore;
    reasons.push(`${matchedTopics.length} topic match${matchedTopics.length > 1 ? "es" : ""}`);
  }

  // 2. Title keyword match (max 25 points)
  const pageTitleLower = (page.title || "").toLowerCase();
  const articleTitleWords = articleTitle
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);

  let titleMatches = 0;
  for (const word of articleTitleWords) {
    if (pageTitleLower.includes(word)) {
      titleMatches++;
    }
  }

  if (titleMatches > 0) {
    const titleScore = Math.min(titleMatches * 8, WEIGHTS.titleMatch);
    totalScore += titleScore;
    reasons.push("title keyword match");
  }

  // 3. Summary keyword match (max 20 points)
  const pageSummaryLower = (page.summary || "").toLowerCase();

  for (const topic of articleTopicsLower.slice(0, 5)) {
    if (pageSummaryLower.includes(topic)) {
      totalScore += 4;
    }
  }
  totalScore = Math.min(totalScore, WEIGHTS.topicOverlap + WEIGHTS.titleMatch + WEIGHTS.summaryMatch);

  if (pageSummaryLower && articleTopicsLower.some((t) => pageSummaryLower.includes(t))) {
    reasons.push("summary relevance");
  }

  // 4. Content length bonus (max 15 points)
  // Prefer pages with substantial content (500-2000 words is ideal)
  const wordCount = page.wordCount || 0;
  if (wordCount >= 500 && wordCount <= 2000) {
    totalScore += 15;
  } else if (wordCount >= 300 && wordCount <= 3000) {
    totalScore += 10;
  } else if (wordCount >= 100) {
    totalScore += 5;
  }

  // Ensure score is within bounds
  const finalScore = Math.round(Math.min(totalScore, 100));

  return {
    score: finalScore,
    matchedTopics,
    reason: reasons.length > 0 ? reasons.join(", ") : "general relevance",
  };
}

/**
 * Score and rank all pages by relevance to article
 */
export function rankPagesByRelevance(
  pages: IndexedPage[],
  articleTopics: string[],
  articleTitle: string,
  options: {
    minScore?: number;
    maxResults?: number;
    excludeUrls?: string[];
  } = {}
): LinkSuggestion[] {
  const { minScore = 20, maxResults = 10, excludeUrls = [] } = options;

  const excludeSet = new Set(excludeUrls.map((u) => u.toLowerCase()));

  const suggestions: LinkSuggestion[] = [];

  for (const page of pages) {
    // Skip excluded URLs
    if (excludeSet.has(page.url.toLowerCase())) {
      continue;
    }

    const { score, matchedTopics, reason } = calculateRelevanceScore(
      articleTopics,
      articleTitle,
      page
    );

    // Only include pages meeting minimum score
    if (score >= minScore) {
      suggestions.push({
        page,
        relevanceScore: score,
        matchedTopics,
        reason,
      });
    }
  }

  // Sort by relevance score (descending)
  suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Return top N results
  return suggestions.slice(0, maxResults);
}

/**
 * Find the best insertion point for a link in content
 * Returns the sentence containing the most relevant context
 */
export function findBestInsertionPoint(
  content: string,
  linkTopics: string[]
): { sentence: string; position: number } | null {
  if (!content || linkTopics.length === 0) {
    return null;
  }

  // Split content into sentences
  const sentences = content.split(/(?<=[.!?])\s+/);
  const topicsLower = new Set(linkTopics.map((t) => t.toLowerCase()));

  let bestSentence = "";
  let bestPosition = -1;
  let bestScore = 0;
  let currentPosition = 0;

  for (const sentence of sentences) {
    const sentenceLower = sentence.toLowerCase();
    let score = 0;

    for (const topic of topicsLower) {
      if (sentenceLower.includes(topic)) {
        score++;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestSentence = sentence;
      bestPosition = currentPosition;
    }

    currentPosition += sentence.length + 1; // +1 for space
  }

  if (bestScore === 0) {
    return null;
  }

  return {
    sentence: bestSentence,
    position: bestPosition,
  };
}
