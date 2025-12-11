"use client";

import * as React from "react";
import {
  Link2,
  ExternalLink,
  Check,
  X,
  Plus,
  LinkIcon,
  Unlink,
  Loader2,
  RefreshCw,
  Info,
} from "lucide-react";

import type { ArticleWithBrand } from "@/lib/actions/articles";
import {
  getArticleLinkSuggestions,
  applyLinkToArticle,
  removeAppliedLink as removeAppliedLinkAction,
  canSuggestLinks,
  type LinkSuggestionResult,
  type AppliedLink,
} from "@/lib/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function RelevanceIndicator({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s >= 70) return "text-green-600";
    if (s >= 40) return "text-amber-600";
    return "text-muted-foreground";
  };

  return (
    <div className="flex items-center gap-2">
      <Progress value={score} className="h-1.5 w-16" />
      <span className={cn("text-xs font-medium tabular-nums", getColor(score))}>
        {score}%
      </span>
    </div>
  );
}

function highlightLinkablePhrases(
  content: string,
  suggestions: LinkSuggestionResult[],
  appliedLinks: AppliedLink[]
): React.ReactNode {
  // Get all anchor texts to highlight
  const suggestionPhrases = suggestions.map((s) => s.suggestedAnchor.toLowerCase());
  const appliedPhrases = appliedLinks.map((l) => l.anchorText.toLowerCase());
  const allPhrases = [...suggestionPhrases, ...appliedPhrases];

  if (allPhrases.length === 0 || !content) {
    return content;
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const lowerContent = content.toLowerCase();

  const matches: { start: number; end: number; phrase: string; isApplied: boolean }[] = [];

  allPhrases.forEach((phrase) => {
    if (!phrase) return;
    let searchIndex = 0;
    while (searchIndex < lowerContent.length) {
      const index = lowerContent.indexOf(phrase, searchIndex);
      if (index === -1) break;

      const overlaps = matches.some(
        (m) => index < m.end && index + phrase.length > m.start
      );
      if (!overlaps) {
        matches.push({
          start: index,
          end: index + phrase.length,
          phrase,
          isApplied: appliedPhrases.includes(phrase),
        });
      }
      searchIndex = index + 1;
    }
  });

  matches.sort((a, b) => a.start - b.start);

  matches.forEach((match) => {
    if (match.start > lastIndex) {
      parts.push(content.slice(lastIndex, match.start));
    }
    parts.push(
      <mark
        key={match.start}
        className={cn(
          "rounded px-0.5",
          match.isApplied
            ? "bg-green-200 dark:bg-green-900/50"
            : "bg-amber-200 dark:bg-amber-900/50"
        )}
      >
        {content.slice(match.start, match.end)}
      </mark>
    );
    lastIndex = match.end;
  });

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : content;
}

interface LinksPageClientProps {
  article: ArticleWithBrand;
}

export function LinksPageClient({ article }: LinksPageClientProps) {
  const [suggestions, setSuggestions] = React.useState<LinkSuggestionResult[]>([]);
  const [appliedLinks, setAppliedLinks] = React.useState<AppliedLink[]>(
    (article.applied_links as AppliedLink[] | null) ?? []
  );
  const [ignoredUrls, setIgnoredUrls] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [canSuggest, setCanSuggest] = React.useState<{ canSuggest: boolean; pageCount: number; message: string } | null>(null);

  // Check if we can suggest links on mount
  React.useEffect(() => {
    canSuggestLinks(article.id).then(setCanSuggest);
  }, [article.id]);

  // Fetch suggestions
  async function fetchSuggestions() {
    setIsFetchingSuggestions(true);
    setError(null);

    const result = await getArticleLinkSuggestions(article.id);

    setIsFetchingSuggestions(false);

    if (!result.success) {
      setError(result.error || "Failed to get suggestions");
      return;
    }

    setSuggestions(result.suggestions || []);
  }

  // Apply a link
  async function handleInsertLink(suggestion: LinkSuggestionResult) {
    setIsLoading(true);
    setError(null);

    const result = await applyLinkToArticle(
      article.id,
      suggestion.pageId,
      suggestion.suggestedAnchor
    );

    setIsLoading(false);

    if (!result.success) {
      setError(result.error || "Failed to apply link");
      return;
    }

    // Update local state
    const newAppliedLink: AppliedLink = {
      pageId: suggestion.pageId,
      url: suggestion.url,
      title: suggestion.title || "",
      anchorText: suggestion.suggestedAnchor,
      appliedAt: new Date().toISOString(),
    };
    setAppliedLinks([...appliedLinks, newAppliedLink]);
  }

  // Remove an applied link
  async function handleRemoveLink(pageId: string) {
    setIsLoading(true);
    setError(null);

    const result = await removeAppliedLinkAction(article.id, pageId);

    setIsLoading(false);

    if (!result.success) {
      setError(result.error || "Failed to remove link");
      return;
    }

    setAppliedLinks(appliedLinks.filter((l) => l.pageId !== pageId));
  }

  // Ignore a suggestion
  function handleIgnoreLink(url: string) {
    setIgnoredUrls([...ignoredUrls, url]);
  }

  // Filter out applied and ignored suggestions
  const visibleSuggestions = suggestions.filter(
    (s) =>
      !appliedLinks.some((a) => a.pageId === s.pageId) &&
      !ignoredUrls.includes(s.url)
  );

  const highlightedContent = highlightLinkablePhrases(
    article.content ?? "",
    visibleSuggestions,
    appliedLinks
  );

  return (
    <div className="relative">
      {/* Main content area */}
      <div className="mr-[360px] min-h-[calc(100vh-8rem)] p-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Article Content</h2>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded bg-amber-200 dark:bg-amber-900/50" />
                <span className="text-muted-foreground">Suggested</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded bg-green-200 dark:bg-green-900/50" />
                <span className="text-muted-foreground">Applied</span>
              </div>
            </div>
          </div>

          <article className="prose prose-sm dark:prose-invert">
            <h1>{article.title}</h1>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {highlightedContent}
            </div>
          </article>
        </div>
      </div>

      {/* Right sidebar - fixed to right edge */}
      <aside className="fixed right-0 top-[8rem] h-[calc(100vh-8rem)] w-[360px] overflow-hidden border-l bg-background shadow-sm">
        <div className="flex h-full flex-col">
          <div className="border-b p-6">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="flex flex-col items-center py-4">
                  <div className="flex items-center gap-2 text-2xl font-bold tabular-nums">
                    <Link2 className="size-5 text-primary" />
                    {visibleSuggestions.length}
                  </div>
                  <p className="text-xs text-muted-foreground">Suggested</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col items-center py-4">
                  <div className="flex items-center gap-2 text-2xl font-bold tabular-nums text-green-600">
                    <Check className="size-5" />
                    {appliedLinks.length}
                  </div>
                  <p className="text-xs text-muted-foreground">Applied</p>
                </CardContent>
              </Card>
            </div>

            {canSuggest && !canSuggest.canSuggest && (
              <Alert className="mt-4">
                <Info className="size-4" />
                <AlertTitle>No Crawled Pages</AlertTitle>
                <AlertDescription>
                  {canSuggest.message}
                </AlertDescription>
              </Alert>
            )}

            {canSuggest && canSuggest.canSuggest && (
              <Button
                className="mt-4 w-full"
                onClick={fetchSuggestions}
                disabled={isFetchingSuggestions}
              >
                {isFetchingSuggestions ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Analyzing...
                  </>
                ) : suggestions.length > 0 ? (
                  <>
                    <RefreshCw className="mr-2 size-4" />
                    Refresh Suggestions
                  </>
                ) : (
                  <>
                    <Link2 className="mr-2 size-4" />
                    Find Link Opportunities
                  </>
                )}
              </Button>
            )}

            {canSuggest && canSuggest.pageCount > 0 && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {canSuggest.pageCount} pages available for cross-linking
              </p>
            )}
          </div>

          {error && (
            <div className="px-6 pt-4">
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-6 p-6">
                {visibleSuggestions.length > 0 && (
                  <section>
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                      <Plus className="size-4" />
                      Suggested Links
                    </h3>
                    <div className="space-y-3">
                      {visibleSuggestions.map((suggestion) => (
                        <Card key={suggestion.pageId}>
                          <CardContent className="space-y-3 p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                  {suggestion.title || suggestion.suggestedAnchor}
                                </p>
                                <a
                                  href={suggestion.url}
                                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="size-3" />
                                  <span className="truncate">{suggestion.url}</span>
                                </a>
                              </div>
                              <RelevanceIndicator score={suggestion.relevanceScore} />
                            </div>

                            {suggestion.summary && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {suggestion.summary}
                              </p>
                            )}

                            {suggestion.matchedTopics.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                <span className="font-medium">Topics:</span>{" "}
                                {suggestion.matchedTopics.slice(0, 3).join(", ")}
                              </p>
                            )}

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => handleInsertLink(suggestion)}
                                disabled={isLoading}
                              >
                                <LinkIcon className="size-3.5" />
                                Insert &ldquo;{suggestion.suggestedAnchor.slice(0, 20)}
                                {suggestion.suggestedAnchor.length > 20 ? "..." : ""}&rdquo;
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleIgnoreLink(suggestion.url)}
                                disabled={isLoading}
                              >
                                <X className="size-3.5" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                )}

                {suggestions.length === 0 && !isFetchingSuggestions && canSuggest?.canSuggest && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Link2 className="mb-3 size-10 text-muted-foreground" />
                    <p className="font-medium">No suggestions yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Click &quot;Find Link Opportunities&quot; to analyze your content
                    </p>
                  </div>
                )}

                {isFetchingSuggestions && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="mb-3 size-10 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Analyzing article for cross-linking opportunities...
                    </p>
                  </div>
                )}

                {appliedLinks.length > 0 && (
                  <section>
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                      <Check className="size-4 text-green-600" />
                      Applied Links
                    </h3>
                    <div className="space-y-2">
                      {appliedLinks.map((link) => (
                        <div
                          key={link.pageId}
                          className="flex items-center justify-between rounded-lg border bg-background p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {link.anchorText}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {link.url}
                            </p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveLink(link.pageId)}
                            disabled={isLoading}
                            aria-label={`Remove link to ${link.anchorText}`}
                          >
                            <Unlink className="size-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </aside>
    </div>
  );
}
