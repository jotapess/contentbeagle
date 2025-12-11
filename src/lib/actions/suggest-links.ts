"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  getBrandPages,
  extractTopicsFromContent,
  rankPagesByRelevance,
  type IndexedPage,
  type LinkSuggestion,
} from "@/lib/services/cross-linking";
import { generateFallbackAnchorText } from "@/lib/ai/prompts/link-suggestions";
import type { Json } from "@/types/database";

/**
 * Applied link stored in article
 */
export interface AppliedLink {
  pageId: string;
  url: string;
  title: string;
  anchorText: string;
  appliedAt: string;
}

/**
 * Link suggestion result for UI
 */
export interface LinkSuggestionResult {
  pageId: string;
  url: string;
  title: string | null;
  summary: string | null;
  relevanceScore: number;
  matchedTopics: string[];
  reason: string;
  suggestedAnchor: string;
}

/**
 * Get link suggestions for an article
 */
export async function getArticleLinkSuggestions(
  articleId: string,
  options: {
    minScore?: number;
    maxResults?: number;
  } = {}
): Promise<{
  success: boolean;
  suggestions?: LinkSuggestionResult[];
  error?: string;
}> {
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get the article with brand info
  const { data: article, error: articleError } = await supabase
    .from("articles")
    .select("id, title, content, brand_id, applied_links")
    .eq("id", articleId)
    .single();

  if (articleError || !article) {
    return { success: false, error: "Article not found" };
  }

  if (!article.brand_id) {
    return { success: false, error: "Article has no associated brand" };
  }

  // Get all crawled pages for the brand
  const pages = await getBrandPages(article.brand_id);

  if (pages.length === 0) {
    return {
      success: true,
      suggestions: [],
    };
  }

  // Extract topics from article content
  const articleTopics = extractTopicsFromContent(article.content || "");
  const articleTitle = article.title || "";

  // Get already applied links to exclude
  const appliedLinks = (article.applied_links as AppliedLink[] | null) || [];
  const excludeUrls = appliedLinks.map((link) => link.url);

  // Rank pages by relevance
  const rankedSuggestions = rankPagesByRelevance(pages, articleTopics, articleTitle, {
    minScore: options.minScore || 20,
    maxResults: options.maxResults || 10,
    excludeUrls,
  });

  // Convert to result format with suggested anchor text
  const suggestions: LinkSuggestionResult[] = rankedSuggestions.map((s) => ({
    pageId: s.page.id,
    url: s.page.url,
    title: s.page.title,
    summary: s.page.summary,
    relevanceScore: s.relevanceScore,
    matchedTopics: s.matchedTopics,
    reason: s.reason,
    suggestedAnchor: generateFallbackAnchorText(s.page),
  }));

  return {
    success: true,
    suggestions,
  };
}

/**
 * Apply a link to an article
 */
export async function applyLinkToArticle(
  articleId: string,
  pageId: string,
  anchorText: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get the page info
  const { data: page, error: pageError } = await supabase
    .from("crawled_pages")
    .select("id, url, title")
    .eq("id", pageId)
    .single();

  if (pageError || !page) {
    return { success: false, error: "Page not found" };
  }

  // Get current article
  const { data: article, error: articleError } = await supabase
    .from("articles")
    .select("applied_links")
    .eq("id", articleId)
    .single();

  if (articleError || !article) {
    return { success: false, error: "Article not found" };
  }

  // Build new applied link
  const newLink: AppliedLink = {
    pageId: page.id,
    url: page.url,
    title: page.title || "",
    anchorText,
    appliedAt: new Date().toISOString(),
  };

  // Add to existing applied links
  const existingLinks = (article.applied_links as AppliedLink[] | null) || [];

  // Check if already applied
  if (existingLinks.some((link) => link.pageId === pageId)) {
    return { success: false, error: "Link already applied" };
  }

  const updatedLinks = [...existingLinks, newLink];

  // Update article
  const { error: updateError } = await supabase
    .from("articles")
    .update({
      applied_links: updatedLinks as unknown as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", articleId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath(`/articles/${articleId}/links`);

  return { success: true };
}

/**
 * Remove an applied link from an article
 */
export async function removeAppliedLink(
  articleId: string,
  pageId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get current article
  const { data: article, error: articleError } = await supabase
    .from("articles")
    .select("applied_links")
    .eq("id", articleId)
    .single();

  if (articleError || !article) {
    return { success: false, error: "Article not found" };
  }

  const existingLinks = (article.applied_links as AppliedLink[] | null) || [];
  const updatedLinks = existingLinks.filter((link) => link.pageId !== pageId);

  // Update article
  const { error: updateError } = await supabase
    .from("articles")
    .update({
      applied_links: updatedLinks as unknown as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", articleId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath(`/articles/${articleId}/links`);

  return { success: true };
}

/**
 * Get applied links for an article
 */
export async function getAppliedLinks(
  articleId: string
): Promise<{
  success: boolean;
  links?: AppliedLink[];
  error?: string;
}> {
  const supabase = await createClient();

  const { data: article, error } = await supabase
    .from("articles")
    .select("applied_links")
    .eq("id", articleId)
    .single();

  if (error || !article) {
    return { success: false, error: "Article not found" };
  }

  const links = (article.applied_links as AppliedLink[] | null) || [];

  return { success: true, links };
}

/**
 * Check if brand has crawled pages available for cross-linking
 */
export async function canSuggestLinks(
  articleId: string
): Promise<{
  canSuggest: boolean;
  pageCount: number;
  message: string;
}> {
  const supabase = await createClient();

  // Get article's brand
  const { data: article, error } = await supabase
    .from("articles")
    .select("brand_id")
    .eq("id", articleId)
    .single();

  if (error || !article || !article.brand_id) {
    return {
      canSuggest: false,
      pageCount: 0,
      message: "Article has no associated brand",
    };
  }

  // Count crawled pages for the brand
  const { count, error: countError } = await supabase
    .from("crawled_pages")
    .select("*", { count: "exact", head: true })
    .eq("brand_id", article.brand_id)
    .eq("is_active", true);

  const pageCount = count || 0;

  if (pageCount === 0) {
    return {
      canSuggest: false,
      pageCount: 0,
      message: "No crawled pages available. Start a website crawl to enable cross-linking.",
    };
  }

  if (pageCount < 3) {
    return {
      canSuggest: true,
      pageCount,
      message: `Only ${pageCount} pages crawled. Crawl more pages for better suggestions.`,
    };
  }

  return {
    canSuggest: true,
    pageCount,
    message: `${pageCount} pages available for cross-linking`,
  };
}
