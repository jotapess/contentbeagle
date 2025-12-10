"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  Sparkles,
  AlertTriangle,
  Check,
  Wand2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import type { AIPatternMatch, PatternSeverity } from "@/types";
import { getArticleById, mockAIPatternRules } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const mockPatternsFound: AIPatternMatch[] = [
  {
    patternId: "delve",
    patternName: 'Overused "Delve"',
    count: 4,
    examples: [
      "Let's delve into the details",
      "delving deeper into automation",
      "we delve into best practices",
      "delve into the world of",
    ],
    locations: [
      { start: 150, end: 155 },
      { start: 420, end: 427 },
      { start: 890, end: 895 },
      { start: 1200, end: 1205 },
    ],
  },
  {
    patternId: "robust",
    patternName: 'Overused "Robust"',
    count: 3,
    examples: [
      "robust solution for teams",
      "robust automation platform",
      "robust set of features",
    ],
    locations: [
      { start: 300, end: 306 },
      { start: 750, end: 756 },
      { start: 1100, end: 1106 },
    ],
  },
  {
    patternId: "leverage",
    patternName: 'Corporate "Leverage"',
    count: 2,
    examples: ["leverage our tools", "leveraging automation"],
    locations: [
      { start: 500, end: 508 },
      { start: 950, end: 959 },
    ],
  },
  {
    patternId: "in-conclusion",
    patternName: "In Conclusion",
    count: 1,
    examples: ["In conclusion, automation"],
    locations: [{ start: 1800, end: 1813 }],
  },
  {
    patternId: "important-note",
    patternName: "Important to Note",
    count: 2,
    examples: [
      "It's important to note that",
      "it's important to note how",
    ],
    locations: [
      { start: 600, end: 628 },
      { start: 1400, end: 1425 },
    ],
  },
];

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

function PatternRuleToggle({
  rule,
  enabled,
  onToggle,
}: {
  rule: (typeof mockAIPatternRules)[0];
  enabled: boolean;
  onToggle: () => void;
}) {
  const severity = severityConfig[rule.severity];

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{rule.name}</span>
          <Badge variant="outline" className={cn("text-xs", severity.className)}>
            {severity.label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{rule.description}</p>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={onToggle}
        aria-label={`Toggle ${rule.name} rule`}
      />
    </div>
  );
}

function highlightAIPatterns(
  content: string,
  patterns: AIPatternMatch[]
): React.ReactNode {
  const allLocations = patterns
    .flatMap((p) =>
      p.locations.map((loc) => ({
        ...loc,
        patternId: p.patternId,
      }))
    )
    .sort((a, b) => a.start - b.start);

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  allLocations.forEach((loc, i) => {
    if (loc.start > lastIndex) {
      parts.push(content.slice(lastIndex, loc.start));
    }
    parts.push(
      <mark
        key={`${loc.patternId}-${i}`}
        className="rounded bg-orange-200 px-0.5 dark:bg-orange-900/50"
      >
        {content.slice(loc.start, loc.end)}
      </mark>
    );
    lastIndex = loc.end;
  });

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : content;
}

export default function HumanizePage() {
  const params = useParams<{ articleId: string }>();
  const article = getArticleById(params.articleId);

  const [patterns] = React.useState<AIPatternMatch[]>(
    article?.aiPatternsFound?.length ? article.aiPatternsFound : mockPatternsFound
  );
  const [expandedPatterns, setExpandedPatterns] = React.useState<string[]>([]);
  const [enabledRules, setEnabledRules] = React.useState<string[]>(
    mockAIPatternRules.filter((r) => r.isActive).map((r) => r.id)
  );
  const [isFixing, setIsFixing] = React.useState(false);

  const aiScore = React.useMemo(() => {
    const totalPatterns = patterns.reduce((sum, p) => sum + p.count, 0);
    return Math.min(Math.round(totalPatterns * 5), 100);
  }, [patterns]);

  const totalIssues = patterns.reduce((sum, p) => sum + p.count, 0);

  function togglePattern(patternId: string) {
    setExpandedPatterns((prev) =>
      prev.includes(patternId)
        ? prev.filter((id) => id !== patternId)
        : [...prev, patternId]
    );
  }

  function toggleRule(ruleId: string) {
    setEnabledRules((prev) =>
      prev.includes(ruleId)
        ? prev.filter((id) => id !== ruleId)
        : [...prev, ruleId]
    );
  }

  async function handleFixAll() {
    setIsFixing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsFixing(false);
  }

  function getPatternSeverity(patternId: string): PatternSeverity {
    const rule = mockAIPatternRules.find((r) => r.id === patternId);
    return rule?.severity ?? "medium";
  }

  if (!article) {
    return null;
  }

  const highlightedContent = highlightAIPatterns(article.content ?? "", patterns);

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      <div className="flex-1 overflow-y-auto border-r p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Article Content</h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="size-3 rounded bg-orange-200 dark:bg-orange-900/50" />
            <span className="text-muted-foreground">AI Pattern Detected</span>
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
            <div className="flex items-center justify-center">
              <AIScoreIndicator score={aiScore} />
            </div>

            <div className="mt-6 flex gap-2">
              <Button
                className="flex-1"
                onClick={handleFixAll}
                disabled={isFixing || totalIssues === 0}
              >
                {isFixing ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    Fixing...
                  </>
                ) : (
                  <>
                    <Wand2 className="size-4" />
                    Fix All ({totalIssues})
                  </>
                )}
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-6 p-6">
              <section>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <AlertTriangle className="size-4 text-amber-500" />
                  Detected Patterns ({patterns.length})
                </h3>

                {patterns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
                    <Check className="mb-2 size-8 text-green-500" />
                    <p className="font-medium">No AI patterns detected</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Your content appears human-written.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {patterns.map((pattern) => {
                      const isExpanded = expandedPatterns.includes(pattern.patternId);
                      const severity = getPatternSeverity(pattern.patternId);
                      const config = severityConfig[severity];

                      return (
                        <Card key={pattern.patternId}>
                          <button
                            className="flex w-full items-center justify-between p-4 text-left"
                            onClick={() => togglePattern(pattern.patternId)}
                            aria-expanded={isExpanded}
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="size-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="size-4 text-muted-foreground" />
                              )}
                              <div>
                                <p className="font-medium">{pattern.patternName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {pattern.count} occurrence
                                  {pattern.count !== 1 ? "s" : ""}
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
                                Examples found:
                              </p>
                              <ul className="space-y-2">
                                {pattern.examples.map((example, i) => (
                                  <li
                                    key={i}
                                    className="flex items-center justify-between rounded-md bg-muted p-2"
                                  >
                                    <span className="text-sm italic">
                                      &ldquo;{example}&rdquo;
                                    </span>
                                    <Button size="sm" variant="ghost" className="h-7">
                                      Fix
                                    </Button>
                                  </li>
                                ))}
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
                  Pattern Rules
                </h3>
                <div className="space-y-2">
                  {mockAIPatternRules.slice(0, 6).map((rule) => (
                    <PatternRuleToggle
                      key={rule.id}
                      rule={rule}
                      enabled={enabledRules.includes(rule.id)}
                      onToggle={() => toggleRule(rule.id)}
                    />
                  ))}
                </div>
              </section>
            </div>
          </ScrollArea>
        </div>
      </aside>
    </div>
  );
}
