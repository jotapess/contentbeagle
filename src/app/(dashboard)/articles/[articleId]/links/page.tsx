"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  Link2,
  ExternalLink,
  Check,
  X,
  Plus,
  LinkIcon,
  Unlink,
} from "lucide-react";

import type { CrossLinkSuggestion } from "@/types";
import { getArticleById } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const mockSuggestedLinks: CrossLinkSuggestion[] = [
  {
    url: "/features/integrations",
    anchorText: "integration capabilities",
    context:
      "Connect your tools seamlessly with our powerful integration capabilities that support over 200 apps.",
    relevanceScore: 0.95,
  },
  {
    url: "/pricing",
    anchorText: "pricing plans",
    context:
      "Choose from flexible pricing plans designed for teams of all sizes, from startups to enterprise.",
    relevanceScore: 0.88,
  },
  {
    url: "/templates",
    anchorText: "automation templates",
    context:
      "Get started faster with pre-built automation templates for common business workflows.",
    relevanceScore: 0.92,
  },
  {
    url: "/blog/getting-started",
    anchorText: "getting started guide",
    context:
      "New to automation? Our comprehensive getting started guide will walk you through the basics.",
    relevanceScore: 0.75,
  },
  {
    url: "/case-studies",
    anchorText: "success stories",
    context:
      "See how other businesses achieved remarkable results with our success stories and case studies.",
    relevanceScore: 0.82,
  },
];

function RelevanceIndicator({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  const getColor = (s: number) => {
    if (s >= 90) return "text-green-600";
    if (s >= 70) return "text-amber-600";
    return "text-muted-foreground";
  };

  return (
    <div className="flex items-center gap-2">
      <Progress value={percentage} className="h-1.5 w-16" />
      <span className={cn("text-xs font-medium tabular-nums", getColor(percentage))}>
        {percentage}%
      </span>
    </div>
  );
}

function highlightLinkablePhrases(
  content: string,
  suggestions: CrossLinkSuggestion[],
  appliedLinks: CrossLinkSuggestion[]
): React.ReactNode {
  const allPhrases = [...suggestions, ...appliedLinks].map((s) =>
    s.anchorText.toLowerCase()
  );

  const appliedPhrases = appliedLinks.map((s) => s.anchorText.toLowerCase());

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const lowerContent = content.toLowerCase();

  const matches: { start: number; end: number; phrase: string; isApplied: boolean }[] =
    [];

  allPhrases.forEach((phrase) => {
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

export default function LinksPage() {
  const params = useParams<{ articleId: string }>();
  const article = getArticleById(params.articleId);

  const [suggestions, setSuggestions] =
    React.useState<CrossLinkSuggestion[]>(mockSuggestedLinks);
  const [appliedLinks, setAppliedLinks] = React.useState<CrossLinkSuggestion[]>(
    article?.appliedLinks ?? []
  );
  const [ignoredLinks, setIgnoredLinks] = React.useState<string[]>([]);

  const visibleSuggestions = suggestions.filter(
    (s) =>
      !appliedLinks.some((a) => a.url === s.url) && !ignoredLinks.includes(s.url)
  );

  function insertLink(suggestion: CrossLinkSuggestion) {
    setAppliedLinks([...appliedLinks, suggestion]);
  }

  function ignoreLink(url: string) {
    setIgnoredLinks([...ignoredLinks, url]);
  }

  function removeAppliedLink(url: string) {
    setAppliedLinks(appliedLinks.filter((l) => l.url !== url));
  }

  if (!article) {
    return null;
  }

  const highlightedContent = highlightLinkablePhrases(
    article.content ?? "",
    visibleSuggestions,
    appliedLinks
  );

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      <div className="flex-1 overflow-y-auto border-r p-6">
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

        <article className="prose prose-sm max-w-none dark:prose-invert">
          <h1>{article.title}</h1>
          <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-muted-foreground">
            {highlightedContent}
          </div>
        </article>
      </div>

      <aside className="w-[400px] shrink-0 overflow-hidden bg-muted/30">
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
          </div>

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
                        <Card key={suggestion.url}>
                          <CardContent className="space-y-3 p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                  {suggestion.anchorText}
                                </p>
                                <a
                                  href={suggestion.url}
                                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="size-3" />
                                  {suggestion.url}
                                </a>
                              </div>
                              <RelevanceIndicator score={suggestion.relevanceScore} />
                            </div>

                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {suggestion.context}
                            </p>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => insertLink(suggestion)}
                              >
                                <LinkIcon className="size-3.5" />
                                Insert
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => ignoreLink(suggestion.url)}
                              >
                                <X className="size-3.5" />
                                Ignore
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                )}

                {visibleSuggestions.length === 0 && appliedLinks.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Link2 className="mb-3 size-10 text-muted-foreground" />
                    <p className="font-medium">No link suggestions</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      No cross-linking opportunities found for this article.
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
                          key={link.url}
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
                            onClick={() => removeAppliedLink(link.url)}
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
