/**
 * Page Index Service
 *
 * Provides searchable access to crawled pages for cross-linking.
 * Uses existing crawled_pages data: key_topics, summary, title, url.
 */

import { createClient } from "@/lib/supabase/server";

/**
 * Indexed page data for cross-linking
 */
export interface IndexedPage {
  id: string;
  url: string;
  title: string | null;
  summary: string | null;
  keyTopics: string[];
  metaDescription: string | null;
  wordCount: number | null;
}

/**
 * Get all indexed pages for a brand
 */
export async function getBrandPages(brandId: string): Promise<IndexedPage[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("crawled_pages")
    .select("id, url, title, summary, key_topics, meta_description, word_count")
    .eq("brand_id", brandId)
    .eq("is_active", true)
    .order("crawled_at", { ascending: false });

  if (error || !data) {
    console.error("Failed to fetch brand pages:", error);
    return [];
  }

  return data.map((page) => ({
    id: page.id,
    url: page.url,
    title: page.title,
    summary: page.summary,
    keyTopics: page.key_topics || [],
    metaDescription: page.meta_description,
    wordCount: page.word_count,
  }));
}

/**
 * Search pages by topic overlap
 */
export async function searchPagesByTopics(
  brandId: string,
  topics: string[]
): Promise<IndexedPage[]> {
  if (topics.length === 0) {
    return [];
  }

  const supabase = await createClient();

  // PostgreSQL array overlap operator
  const { data, error } = await supabase
    .from("crawled_pages")
    .select("id, url, title, summary, key_topics, meta_description, word_count")
    .eq("brand_id", brandId)
    .eq("is_active", true)
    .overlaps("key_topics", topics)
    .order("crawled_at", { ascending: false })
    .limit(20);

  if (error || !data) {
    console.error("Failed to search pages by topics:", error);
    return [];
  }

  return data.map((page) => ({
    id: page.id,
    url: page.url,
    title: page.title,
    summary: page.summary,
    keyTopics: page.key_topics || [],
    metaDescription: page.meta_description,
    wordCount: page.word_count,
  }));
}

/**
 * Get a single page by ID
 */
export async function getPageById(pageId: string): Promise<IndexedPage | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("crawled_pages")
    .select("id, url, title, summary, key_topics, meta_description, word_count")
    .eq("id", pageId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    url: data.url,
    title: data.title,
    summary: data.summary,
    keyTopics: data.key_topics || [],
    metaDescription: data.meta_description,
    wordCount: data.word_count,
  };
}

/**
 * Extract key topics from article content
 * Simple keyword extraction based on common SEO patterns
 */
export function extractTopicsFromContent(content: string): string[] {
  if (!content) return [];

  // Normalize content
  const text = content.toLowerCase();

  // Extract potential topic phrases (2-3 word phrases that appear multiple times)
  const words = text
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);

  // Count word frequencies
  const wordFreq = new Map<string, number>();
  for (const word of words) {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  }

  // Get top words by frequency (appearing more than once)
  const topWords = Array.from(wordFreq.entries())
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);

  // Filter out common stop words
  const stopWords = new Set([
    "that", "this", "with", "from", "have", "been", "were", "will", "would",
    "could", "should", "their", "there", "which", "about", "when", "what",
    "your", "more", "some", "also", "into", "only", "other", "than",
    "just", "very", "most", "even", "such", "each", "much", "both",
  ]);

  return topWords.filter((w) => !stopWords.has(w));
}

/**
 * Get page content for context
 */
export async function getPageContent(pageId: string): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("crawled_pages")
    .select("markdown_content, plain_text")
    .eq("id", pageId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.markdown_content || data.plain_text || null;
}
