"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  AlertTriangle,
  Check,
  Wand2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Loader2,
  Save,
} from "lucide-react";

import type { ArticleWithBrand } from "@/lib/actions/articles";
import { updateArticleContent, transitionArticleStatus } from "@/lib/actions/articles";
import { useHumanization } from "@/hooks/use-humanization";
import type { PatternMatch } from "@/lib/ai";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type PatternSeverity = "low" | "medium" | "high";

const severityConfig: Record<
  PatternSeverity,
  { label: string; className: string; bgClass: string }
> = {
  low: {
    label: "Low",
    className: "text-blue-600 border-blue-200 bg-blue-100",
    bgClass: "bg-blue-200 dark:bg-blue-900/50",
  },
  medium: {
    label: "Medium",
    className: "text-amber-600 border-amber-200 bg-amber-100",
    bgClass: "bg-amber-200 dark:bg-amber-900/50",
  },
  high: {
    label: "High",
    className: "text-red-600 border-red-200 bg-red-100",
    bgClass: "bg-red-200 dark:bg-red-900/50",
  },
};

function AIScoreIndicator({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s <= 20) return "text-green-500";
    if (s <= 50) return "text-amber-500";
    return "text-red-500";
  };

  const getLabel = (s: number) => {
    if (s <= 20) return "Human-like";
    if (s <= 50) return "Mixed";
    return "AI-detected";
  };

  return (
    <div className="flex flex-col items-center">
      <div className={cn("text-4xl font-bold tabular-nums", getColor(score))}>
        {score}%
      </div>
      <p className="text-sm text-muted-foreground">AI Detection Score</p>
      <Badge
        variant="outline"
        className={cn(
          "mt-2",
          score <= 20 && "bg-green-100 text-green-700 border-green-200",
          score > 20 && score <= 50 && "bg-amber-100 text-amber-700 border-amber-200",
          score > 50 && "bg-red-100 text-red-700 border-red-200"
        )}
      >
        {getLabel(score)}
      </Badge>
    </div>
  );
}

function highlightPatterns(
  content: string,
  matches: PatternMatch[]
): React.ReactNode {
  if (!matches.length) return content;

  // Sort by position and remove overlaps
  const sortedMatches = [...matches].sort(
    (a, b) => a.location.start - b.location.start
  );

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const match of sortedMatches) {
    // Skip overlapping matches
    if (match.location.start < lastIndex) continue;

    if (match.location.start > lastIndex) {
      parts.push(content.slice(lastIndex, match.location.start));
    }

    const severity = match.severity || "medium";
    parts.push(
      <TooltipProvider key={`${match.ruleId}-${match.location.start}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <mark
              className={cn(
                "rounded px-0.5 cursor-help",
                severityConfig[severity].bgClass
              )}
            >
              {match.matchedText}
            </mark>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">{match.ruleName}</p>
            {match.replacementOptions.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Try: {match.replacementOptions.slice(0, 3).join(", ")}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    lastIndex = match.location.end;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : content;
}

// Group matches by rule for display
function groupMatchesByRule(matches: PatternMatch[]): Map<string, PatternMatch[]> {
  const grouped = new Map<string, PatternMatch[]>();
  for (const match of matches) {
    const existing = grouped.get(match.ruleId) || [];
    existing.push(match);
    grouped.set(match.ruleId, existing);
  }
  return grouped;
}

interface HumanizePageClientProps {
  article: ArticleWithBrand;
}

export function HumanizePageClient({ article }: HumanizePageClientProps) {
  const router = useRouter();
  const {
    detectionResult,
    isDetecting,
    detect,
    humanizedContent,
    isHumanizing,
    humanize,
    error,
    abort,
  } = useHumanization();

  const [expandedPatterns, setExpandedPatterns] = React.useState<string[]>([]);
  const [currentContent, setCurrentContent] = React.useState(article.content || "");
  const [showHumanized, setShowHumanized] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Run detection on mount
  React.useEffect(() => {
    if (article.content) {
      detect(article.id, article.content);
    }
  }, [article.id, article.content, detect]);

  const matches = detectionResult?.matches || [];
  const aiScore = detectionResult?.aiScore || 0;
  const groupedMatches = groupMatchesByRule(matches);
  const totalIssues = matches.length;

  function togglePattern(patternId: string) {
    setExpandedPatterns((prev) =>
      prev.includes(patternId)
        ? prev.filter((id) => id !== patternId)
        : [...prev, patternId]
    );
  }

  async function handleHumanize() {
    if (!article.brand_id) return;

    try {
      await humanize({
        articleId: article.id,
        brandId: article.brand_id,
        content: currentContent,
        matches,
      });
      setShowHumanized(true);
    } catch {
      // Error is handled by hook
    }
  }

  async function handleApplyHumanized() {
    if (!humanizedContent) return;

    setIsSaving(true);
    try {
      await updateArticleContent(article.id, { content: humanizedContent, changeSummary: "Applied AI humanization" });
      setCurrentContent(humanizedContent);
      setShowHumanized(false);
      // Re-detect patterns in new content
      await detect(article.id, humanizedContent);
      router.refresh();
    } catch {
      // Error handling
    } finally {
      setIsSaving(false);
    }
  }

  async function handleMarkComplete() {
    setIsSaving(true);
    try {
      await transitionArticleStatus(article.id, "polished", "Humanization complete");
      router.push(`/articles/${article.id}`);
    } catch {
      // Error handling
    } finally {
      setIsSaving(false);
    }
  }

  const highlightedContent = highlightPatterns(
    showHumanized && humanizedContent ? humanizedContent : currentContent,
    showHumanized ? [] : matches
  );

  return (
    <div className="relative">
      {/* Content Panel */}
      <div className="mr-[360px] min-h-[calc(100vh-8rem)] p-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {showHumanized ? "Humanized Content" : "Article Content"}
              </h2>
              {showHumanized && (
                <p className="text-sm text-muted-foreground">
                  Review the humanized version below
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!showHumanized && (
                <>
                  <span className="size-3 rounded bg-orange-200 dark:bg-orange-900/50" />
                  <span className="text-sm text-muted-foreground">AI Pattern Detected</span>
                </>
              )}
              {showHumanized && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHumanized(false)}
                  >
                    View Original
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApplyHumanized}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    Apply Changes
                  </Button>
                </div>
              )}
            </div>
          </div>

          <article className="prose prose-sm dark:prose-invert">
            <h1>{article.title}</h1>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {isHumanizing ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <Loader2 className="size-4 animate-spin" />
                    <span>Humanizing content...</span>
                  </div>
                  {humanizedContent && (
                    <div className="rounded-lg border bg-muted/50 p-4">
                      {humanizedContent}
                    </div>
                  )}
                </div>
              ) : (
                highlightedContent
              )}
            </div>
          </article>
        </div>
      </div>

      {/* Right sidebar - fixed to right edge */}
      <aside className="fixed right-0 top-[8rem] h-[calc(100vh-8rem)] w-[360px] overflow-hidden border-l bg-background shadow-sm">
        <div className="flex h-full flex-col">
          {/* Score Section */}
          <div className="border-b p-6">
            {isDetecting ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Analyzing content...</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center">
                  <AIScoreIndicator score={aiScore} />
                </div>

                {error && (
                  <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="mt-6 flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={handleHumanize}
                    disabled={isHumanizing || isDetecting || totalIssues === 0 || !article.brand_id}
                  >
                    {isHumanizing ? (
                      <>
                        <RefreshCw className="size-4 animate-spin" />
                        Humanizing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="size-4" />
                        Humanize All ({totalIssues})
                      </>
                    )}
                  </Button>
                  {isHumanizing && (
                    <Button variant="outline" onClick={abort}>
                      Cancel
                    </Button>
                  )}
                </div>

                {aiScore <= 20 && totalIssues === 0 && (
                  <Button
                    className="mt-2 w-full"
                    variant="outline"
                    onClick={handleMarkComplete}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}
                    Mark as Polished
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Patterns List */}
          <ScrollArea className="flex-1">
            <div className="space-y-6 p-6">
              <section>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <AlertTriangle className="size-4 text-amber-500" />
                  Detected Patterns ({groupedMatches.size})
                </h3>

                {isDetecting ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : groupedMatches.size === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
                    <Check className="mb-2 size-8 text-green-500" />
                    <p className="font-medium">No AI patterns detected</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Your content appears human-written.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Array.from(groupedMatches.entries()).map(([ruleId, ruleMatches]) => {
                      const firstMatch = ruleMatches[0];
                      const isExpanded = expandedPatterns.includes(ruleId);
                      const severity = (firstMatch.severity || "medium") as PatternSeverity;
                      const config = severityConfig[severity];

                      return (
                        <Card key={ruleId}>
                          <button
                            className="flex w-full items-center justify-between p-4 text-left"
                            onClick={() => togglePattern(ruleId)}
                            aria-expanded={isExpanded}
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="size-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="size-4 text-muted-foreground" />
                              )}
                              <div>
                                <p className="font-medium">{firstMatch.ruleName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {ruleMatches.length} occurrence
                                  {ruleMatches.length !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn("text-xs", config.className)}
                            >
                              {config.label}
                            </Badge>
                          </button>

                          {isExpanded && (
                            <CardContent className="border-t pt-4">
                              <p className="mb-3 text-xs font-medium text-muted-foreground">
                                Found in content:
                              </p>
                              <ul className="space-y-2">
                                {ruleMatches.slice(0, 5).map((match, i) => (
                                  <li
                                    key={i}
                                    className="rounded-md bg-muted p-2"
                                  >
                                    <span className="text-sm italic">
                                      &ldquo;{match.matchedText}&rdquo;
                                    </span>
                                    {match.replacementOptions.length > 0 && (
                                      <p className="mt-1 text-xs text-muted-foreground">
                                        Try: {match.replacementOptions.slice(0, 3).join(", ")}
                                      </p>
                                    )}
                                  </li>
                                ))}
                                {ruleMatches.length > 5 && (
                                  <li className="text-xs text-muted-foreground">
                                    +{ruleMatches.length - 5} more occurrences
                                  </li>
                                )}
                              </ul>
                            </CardContent>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                )}
              </section>

              <Separator />

              <section>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="size-4" />
                  Detection Summary
                </h3>
                {detectionResult && (
                  <div className="space-y-2 text-sm">
                    {Object.entries(detectionResult.matchesByCategory || {}).map(
                      ([category, count]) => (
                        <div
                          key={category}
                          className="flex items-center justify-between rounded-lg bg-muted p-2"
                        >
                          <span className="capitalize">
                            {category.replace(/_/g, " ")}
                          </span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      )
                    )}
                    {Object.keys(detectionResult.matchesByCategory || {}).length === 0 && (
                      <p className="text-muted-foreground">No patterns found</p>
                    )}
                  </div>
                )}
              </section>
            </div>
          </ScrollArea>
        </div>
      </aside>
    </div>
  );
}
