/**
 * Link Suggestions AI Prompts
 *
 * Prompts for generating contextual anchor text and link suggestions.
 */

import type { IndexedPage } from "@/lib/services/cross-linking/page-index";

/**
 * Anchor text suggestion
 */
export interface AnchorTextSuggestion {
  anchorText: string;
  contextSnippet: string;
  reason: string;
}

/**
 * Build system prompt for anchor text generation
 */
export function buildAnchorTextSystemPrompt(): string {
  return `You are an expert SEO copywriter specializing in natural internal linking.

Your task is to suggest anchor text for internal links that:
1. Reads naturally within the sentence context
2. Accurately describes the destination page
3. Uses 2-5 words (avoid single word anchors and overly long phrases)
4. Avoids generic text like "click here", "read more", "learn more"
5. Incorporates relevant keywords without keyword stuffing

You will receive:
- The article paragraph where the link should be inserted
- Information about the destination page (title, summary, topics)

Respond with a JSON object containing:
- "anchorText": The suggested anchor text (2-5 words)
- "contextSnippet": A rewritten version of the paragraph with the anchor text naturally inserted (mark the anchor with **double asterisks**)
- "reason": Brief explanation of why this anchor text works (1 sentence)`;
}

/**
 * Build user prompt for anchor text generation
 */
export function buildAnchorTextUserPrompt(
  articleParagraph: string,
  destinationPage: IndexedPage
): string {
  return `Generate anchor text for linking from this article paragraph to the destination page.

**Article Paragraph:**
${articleParagraph}

**Destination Page:**
- Title: ${destinationPage.title || "Untitled"}
- Summary: ${destinationPage.summary || "No summary available"}
- Key Topics: ${destinationPage.keyTopics.join(", ") || "None"}
- URL: ${destinationPage.url}

Provide your response as JSON:
{
  "anchorText": "suggested anchor text",
  "contextSnippet": "rewritten paragraph with **anchor text** marked",
  "reason": "why this anchor text works"
}`;
}

/**
 * Parse anchor text response from AI
 */
export function parseAnchorTextResponse(response: string): AnchorTextSuggestion | null {
  try {
    // Handle responses that might have markdown code blocks
    let jsonStr = response;
    if (response.includes("```json")) {
      jsonStr = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    } else if (response.includes("```")) {
      jsonStr = response.replace(/```\n?/g, "").trim();
    }

    const parsed = JSON.parse(jsonStr);

    if (!parsed.anchorText || typeof parsed.anchorText !== "string") {
      return null;
    }

    return {
      anchorText: parsed.anchorText,
      contextSnippet: parsed.contextSnippet || "",
      reason: parsed.reason || "",
    };
  } catch {
    console.error("Failed to parse anchor text response");
    return null;
  }
}

/**
 * Generate fallback anchor text without AI
 * Uses simple heuristics based on page title and topics
 */
export function generateFallbackAnchorText(page: IndexedPage): string {
  // Try to use the page title, shortened if necessary
  if (page.title) {
    const title = page.title.trim();
    const words = title.split(/\s+/);

    // If title is 2-5 words, use it directly
    if (words.length >= 2 && words.length <= 5) {
      return title;
    }

    // If title is longer, try to extract key phrase
    if (words.length > 5) {
      // Take first 3-4 meaningful words
      const meaningfulWords = words.filter(
        (w) => !["the", "a", "an", "and", "or", "to", "for", "of", "in", "on"].includes(w.toLowerCase())
      );
      return meaningfulWords.slice(0, 4).join(" ");
    }

    // Single word title - try to combine with first topic
    if (page.keyTopics.length > 0) {
      return `${title} ${page.keyTopics[0]}`.slice(0, 50);
    }

    return title;
  }

  // Fall back to first topic or URL-based anchor
  if (page.keyTopics.length > 0) {
    const topic = page.keyTopics[0];
    // Capitalize first letter
    return topic.charAt(0).toUpperCase() + topic.slice(1);
  }

  // Last resort: extract from URL
  const urlParts = page.url.split("/").filter(Boolean);
  const lastPart = urlParts[urlParts.length - 1] || "this page";
  return lastPart.replace(/-/g, " ").replace(/\.[^.]+$/, "");
}

/**
 * Build prompt for batch link suggestions
 */
export function buildBatchLinkSuggestionsPrompt(
  articleContent: string,
  articleTitle: string,
  pages: IndexedPage[]
): string {
  const pageList = pages
    .slice(0, 10) // Limit to 10 pages
    .map(
      (p, i) =>
        `${i + 1}. "${p.title || "Untitled"}" - ${p.summary?.slice(0, 100) || "No summary"}... (Topics: ${p.keyTopics.slice(0, 3).join(", ") || "none"})`
    )
    .join("\n");

  return `Analyze this article and suggest which internal pages would be most valuable to link to.

**Article Title:** ${articleTitle}

**Article Content (excerpt):**
${articleContent.slice(0, 1500)}...

**Available Pages to Link:**
${pageList}

For each recommended link, provide:
1. Page number (from list above)
2. Why this link adds value
3. Where in the article it should be placed
4. Suggested anchor text

Respond as JSON array:
[
  {
    "pageNumber": 1,
    "reason": "why to link here",
    "placement": "where in article",
    "anchorText": "suggested anchor"
  }
]`;
}
