/**
 * Intelligence Aggregation Service
 *
 * Aggregates page-level intelligence into brand-level insights.
 * Combines keywords, topics, and voice analysis from multiple pages
 * into a unified brand intelligence record.
 */

import type { PageExtraction, BrandVoice } from "./extraction";

/**
 * Aggregated keyword with frequency and source tracking
 */
export interface AggregatedKeyword {
  keyword: string;
  frequency: number;
  relevanceScore: number;
  type: "primary" | "secondary" | "long-tail";
  sourcePages: string[];
}

/**
 * Aggregated topic with related keywords
 */
export interface AggregatedTopic {
  topic: string;
  frequency: number;
  relatedKeywords: string[];
  sourcePages: string[];
}

/**
 * Brand intelligence summary for storage
 */
export interface BrandIntelligenceSummary {
  extractedKeywords: AggregatedKeyword[];
  extractedTopics: AggregatedTopic[];
  voiceSummary: {
    tone: string;
    style: string;
    vocabularyLevel: string;
    keyPhrases: string[];
  };
  pagesAnalyzed: number;
}

/**
 * Aggregate keywords from multiple page extractions
 *
 * Combines keywords across pages, tracking frequency and averaging relevance scores.
 */
export function aggregateKeywords(
  pageExtractions: Map<string, PageExtraction>,
  pageUrls: Map<string, string>
): AggregatedKeyword[] {
  const keywordMap = new Map<
    string,
    {
      relevanceScores: number[];
      type: "primary" | "secondary" | "long-tail";
      sourcePages: string[];
    }
  >();

  // Collect keywords from all pages
  for (const [pageId, extraction] of pageExtractions) {
    const pageUrl = pageUrls.get(pageId) || pageId;

    for (const keyword of extraction.keywords) {
      const normalizedTerm = keyword.term.toLowerCase().trim();

      if (!keywordMap.has(normalizedTerm)) {
        keywordMap.set(normalizedTerm, {
          relevanceScores: [],
          type: keyword.type,
          sourcePages: [],
        });
      }

      const entry = keywordMap.get(normalizedTerm)!;
      entry.relevanceScores.push(keyword.relevance);
      entry.sourcePages.push(pageUrl);

      // Upgrade type if a more important classification is found
      if (keyword.type === "primary" && entry.type !== "primary") {
        entry.type = "primary";
      } else if (keyword.type === "secondary" && entry.type === "long-tail") {
        entry.type = "secondary";
      }
    }
  }

  // Convert to aggregated keywords
  const aggregated: AggregatedKeyword[] = [];

  for (const [keyword, data] of keywordMap) {
    const avgRelevance =
      data.relevanceScores.reduce((sum, score) => sum + score, 0) /
      data.relevanceScores.length;

    aggregated.push({
      keyword,
      frequency: data.sourcePages.length,
      relevanceScore: Math.round(avgRelevance * 100) / 100,
      type: data.type,
      sourcePages: [...new Set(data.sourcePages)], // Dedupe URLs
    });
  }

  // Sort by frequency * relevance (importance score)
  aggregated.sort((a, b) => {
    const scoreA = a.frequency * a.relevanceScore;
    const scoreB = b.frequency * b.relevanceScore;
    return scoreB - scoreA;
  });

  return aggregated;
}

/**
 * Aggregate topics from multiple page extractions
 *
 * Groups similar topics and tracks which pages discuss them.
 */
export function aggregateTopics(
  pageExtractions: Map<string, PageExtraction>,
  pageUrls: Map<string, string>,
  keywords: AggregatedKeyword[]
): AggregatedTopic[] {
  const topicMap = new Map<
    string,
    {
      sourcePages: string[];
    }
  >();

  // Collect topics from all pages
  for (const [pageId, extraction] of pageExtractions) {
    const pageUrl = pageUrls.get(pageId) || pageId;

    for (const topic of extraction.topics) {
      const normalizedTopic = topic.toLowerCase().trim();

      if (!topicMap.has(normalizedTopic)) {
        topicMap.set(normalizedTopic, { sourcePages: [] });
      }

      topicMap.get(normalizedTopic)!.sourcePages.push(pageUrl);
    }

    // Also add primary topic if not already present
    const primaryTopic = extraction.primaryTopic.toLowerCase().trim();
    if (!topicMap.has(primaryTopic)) {
      topicMap.set(primaryTopic, { sourcePages: [] });
    }
    topicMap.get(primaryTopic)!.sourcePages.push(pageUrl);
  }

  // Convert to aggregated topics
  const aggregated: AggregatedTopic[] = [];

  for (const [topic, data] of topicMap) {
    // Find related keywords (keywords that contain topic words or vice versa)
    const relatedKeywords = keywords
      .filter((k) => {
        const topicWords = topic.split(/\s+/);
        const keywordWords = k.keyword.split(/\s+/);
        return (
          topicWords.some((tw) => k.keyword.includes(tw)) ||
          keywordWords.some((kw) => topic.includes(kw))
        );
      })
      .slice(0, 10)
      .map((k) => k.keyword);

    aggregated.push({
      topic,
      frequency: new Set(data.sourcePages).size, // Count unique pages
      relatedKeywords,
      sourcePages: [...new Set(data.sourcePages)],
    });
  }

  // Sort by frequency
  aggregated.sort((a, b) => b.frequency - a.frequency);

  return aggregated;
}

/**
 * Create full brand intelligence summary
 */
export function createBrandIntelligenceSummary(
  pageExtractions: Map<string, PageExtraction>,
  pageUrls: Map<string, string>,
  brandVoice: BrandVoice | null
): BrandIntelligenceSummary {
  const keywords = aggregateKeywords(pageExtractions, pageUrls);
  const topics = aggregateTopics(pageExtractions, pageUrls, keywords);

  return {
    extractedKeywords: keywords.slice(0, 100), // Top 100 keywords
    extractedTopics: topics.slice(0, 50), // Top 50 topics
    voiceSummary: brandVoice
      ? {
          tone: brandVoice.tone,
          style: brandVoice.style,
          vocabularyLevel: brandVoice.vocabularyLevel,
          keyPhrases: brandVoice.keyPhrases,
        }
      : {
          tone: "professional",
          style: "formal",
          vocabularyLevel: "moderate",
          keyPhrases: [],
        },
    pagesAnalyzed: pageExtractions.size,
  };
}

/**
 * Calculate content gaps - topics with high search potential but low coverage
 *
 * Takes extracted topics and keyword opportunities from DataForSEO
 * to identify content gaps.
 */
export function identifyContentGaps(
  extractedTopics: AggregatedTopic[],
  keywordOpportunities: Array<{
    keyword: string;
    searchVolume: number;
    competition: number;
  }>,
  maxGaps: number = 10
): Array<{
  topic: string;
  reason: string;
  searchVolume: number;
  suggestedKeywords: string[];
}> {
  const gaps: Array<{
    topic: string;
    reason: string;
    searchVolume: number;
    suggestedKeywords: string[];
  }> = [];

  // Find keywords with high volume but not in extracted topics
  const topicKeywords = new Set(
    extractedTopics.flatMap((t) => [t.topic, ...t.relatedKeywords])
  );

  for (const opp of keywordOpportunities) {
    const normalizedKeyword = opp.keyword.toLowerCase();

    // Check if this keyword is already covered
    const isCovered = topicKeywords.has(normalizedKeyword) ||
      Array.from(topicKeywords).some(
        (tk) => tk.includes(normalizedKeyword) || normalizedKeyword.includes(tk)
      );

    if (!isCovered && opp.searchVolume > 100) {
      gaps.push({
        topic: opp.keyword,
        reason: `High search volume (${opp.searchVolume}) with ${opp.competition < 50 ? "low" : "moderate"} competition`,
        searchVolume: opp.searchVolume,
        suggestedKeywords: [opp.keyword],
      });
    }
  }

  // Sort by search volume and return top gaps
  gaps.sort((a, b) => b.searchVolume - a.searchVolume);

  return gaps.slice(0, maxGaps);
}
