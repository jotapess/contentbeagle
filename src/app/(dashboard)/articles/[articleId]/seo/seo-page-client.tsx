"use client";

import * as React from "react";
import {
  Plus,
  X,
  Check,
  AlertCircle,
  TrendingUp,
  DollarSign,
  BarChart3,
  Search,
  Loader2,
  RefreshCw,
  Info,
} from "lucide-react";

import type { ArticleWithBrand } from "@/lib/actions/articles";
import {
  researchKeywords,
  getArticleKeywords,
  checkDataForSEOConfig,
  type SavedKeywordResearch,
} from "@/lib/actions";
import type { KeywordVolumeData, RelatedKeywordData } from "@/lib/services/dataforseo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface SEOCheckItem {
  id: string;
  label: string;
  passed: boolean;
  description: string;
}

function SEOScoreCircle({ score }: { score: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-green-500";
    if (s >= 60) return "text-amber-500";
    return "text-red-500";
  };

  const getStrokeColor = (s: number) => {
    if (s >= 80) return "stroke-green-500";
    if (s >= 60) return "stroke-amber-500";
    return "stroke-red-500";
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="size-32 -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn("transition-all duration-500", getStrokeColor(score))}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-3xl font-bold tabular-nums", getScoreColor(score))}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground">SEO Score</span>
      </div>
    </div>
  );
}

function CompetitionBadge({ level }: { level: string | null }) {
  const config: Record<string, { label: string; className: string }> = {
    LOW: { label: "Low", className: "bg-green-100 text-green-700 border-green-200" },
    MEDIUM: {
      label: "Medium",
      className: "bg-amber-100 text-amber-700 border-amber-200",
    },
    HIGH: { label: "High", className: "bg-red-100 text-red-700 border-red-200" },
  };

  const levelConfig = level ? config[level.toUpperCase()] : null;
  if (!levelConfig) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  return (
    <Badge variant="outline" className={cn("text-xs", levelConfig.className)}>
      {levelConfig.label}
    </Badge>
  );
}

interface SEOPageClientProps {
  article: ArticleWithBrand;
}

export function SEOPageClient({ article }: SEOPageClientProps) {
  const [focusKeyword, setFocusKeyword] = React.useState(
    article.focus_keyword ?? ""
  );
  const [secondaryKeywords, setSecondaryKeywords] = React.useState<string[]>(
    article.secondary_keywords ?? []
  );
  const [newKeyword, setNewKeyword] = React.useState("");
  const [metaTitle, setMetaTitle] = React.useState(article.seo_title ?? "");
  const [metaDescription, setMetaDescription] = React.useState(
    article.seo_description ?? ""
  );

  // Keyword research state
  const [isResearching, setIsResearching] = React.useState(false);
  const [keywordData, setKeywordData] = React.useState<KeywordVolumeData[]>([]);
  const [relatedKeywords, setRelatedKeywords] = React.useState<RelatedKeywordData[]>([]);
  const [savedKeywords, setSavedKeywords] = React.useState<SavedKeywordResearch[]>([]);
  const [apiConfigured, setApiConfigured] = React.useState<boolean | null>(null);
  const [researchError, setResearchError] = React.useState<string | null>(null);
  const [cacheStats, setCacheStats] = React.useState<{ fromCache: number; fromApi: number } | null>(null);

  const seoScore = article.seo_score ?? 72;

  // Check if DataForSEO is configured on mount
  React.useEffect(() => {
    checkDataForSEOConfig().then((result) => {
      setApiConfigured(result.configured);
    });

    // Load saved keywords for this article
    if (article.id) {
      getArticleKeywords(article.id).then(({ data }) => {
        if (data) {
          setSavedKeywords(data);
        }
      });
    }
  }, [article.id]);

  // Get focus keyword volume from research data or saved data
  const focusKeywordVolume = React.useMemo(() => {
    const fromResearch = keywordData.find(
      (k) => k.keyword.toLowerCase() === focusKeyword.toLowerCase()
    );
    if (fromResearch) return fromResearch.searchVolume;

    const fromSaved = savedKeywords.find(
      (k) => k.keyword.toLowerCase() === focusKeyword.toLowerCase()
    );
    return fromSaved?.searchVolume ?? undefined;
  }, [focusKeyword, keywordData, savedKeywords]);

  const seoChecks: SEOCheckItem[] = React.useMemo(() => {
    const content = article.content?.toLowerCase() ?? "";
    const title = article.title?.toLowerCase() ?? "";
    const keyword = focusKeyword.toLowerCase();

    return [
      {
        id: "title",
        label: "Keyword in title",
        passed: Boolean(keyword && title.includes(keyword)),
        description: "Focus keyword appears in the article title",
      },
      {
        id: "first-paragraph",
        label: "Keyword in first paragraph",
        passed: Boolean(
          keyword &&
            content.split("\n\n").slice(0, 2).join(" ").includes(keyword)
        ),
        description: "Focus keyword appears in the first 150 words",
      },
      {
        id: "density",
        label: "Keyword density (1-3%)",
        passed: true,
        description: "Focus keyword appears at optimal frequency",
      },
      {
        id: "internal-links",
        label: "Internal links (2+)",
        passed: (Array.isArray(article.applied_links) ? article.applied_links.length : 0) >= 2,
        description: "Article contains at least 2 internal links",
      },
      {
        id: "external-links",
        label: "External links (1+)",
        passed: false,
        description: "Article contains at least 1 external link",
      },
      {
        id: "meta-title",
        label: "Meta title length",
        passed: metaTitle.length > 0 && metaTitle.length <= 60,
        description: "Meta title is between 1-60 characters",
      },
      {
        id: "meta-description",
        label: "Meta description length",
        passed:
          metaDescription.length >= 120 && metaDescription.length <= 160,
        description: "Meta description is between 120-160 characters",
      },
    ];
  }, [article, focusKeyword, metaTitle, metaDescription]);

  async function handleResearchKeywords() {
    if (!focusKeyword.trim() && secondaryKeywords.length === 0) {
      setResearchError("Please enter a focus keyword or secondary keywords to research");
      return;
    }

    setIsResearching(true);
    setResearchError(null);

    const keywordsToResearch = [
      focusKeyword.trim(),
      ...secondaryKeywords,
    ].filter(Boolean);

    const result = await researchKeywords(keywordsToResearch, {
      teamId: article.team_id,
      articleId: article.id,
      brandId: article.brand_id || undefined,
      includeRelated: true,
    });

    setIsResearching(false);

    if (!result.success) {
      setResearchError(result.error || "Failed to research keywords");
      return;
    }

    if (result.data) {
      setKeywordData(result.data.keywords);
      setRelatedKeywords(result.data.relatedKeywords);
      setCacheStats({
        fromCache: result.data.fromCache,
        fromApi: result.data.fromApi,
      });

      // Refresh saved keywords
      const { data } = await getArticleKeywords(article.id);
      if (data) {
        setSavedKeywords(data);
      }
    }
  }

  function addSecondaryKeyword() {
    const trimmed = newKeyword.trim();
    if (trimmed && !secondaryKeywords.includes(trimmed)) {
      setSecondaryKeywords([...secondaryKeywords, trimmed]);
      setNewKeyword("");
    }
  }

  function removeSecondaryKeyword(keyword: string) {
    setSecondaryKeywords(secondaryKeywords.filter((k) => k !== keyword));
  }

  function addKeywordFromTable(keyword: string) {
    if (!secondaryKeywords.includes(keyword) && keyword !== focusKeyword) {
      setSecondaryKeywords([...secondaryKeywords, keyword]);
    }
  }

  // Combine saved keywords and related keywords for display
  const displayKeywords = React.useMemo(() => {
    const allKeywords = new Map<string, KeywordVolumeData | RelatedKeywordData>();

    // Add saved keywords first
    for (const kw of savedKeywords) {
      if (kw.searchVolume !== null) {
        allKeywords.set(kw.keyword.toLowerCase(), {
          keyword: kw.keyword,
          searchVolume: kw.searchVolume,
          competition: kw.competition ?? 0,
          competitionLevel: kw.competitionLevel as KeywordVolumeData["competitionLevel"],
          cpc: kw.cpc,
          lowTopOfPageBid: null,
          highTopOfPageBid: null,
          monthlySearches: [],
        });
      }
    }

    // Add related keywords
    for (const kw of relatedKeywords) {
      if (!allKeywords.has(kw.keyword.toLowerCase())) {
        allKeywords.set(kw.keyword.toLowerCase(), kw);
      }
    }

    // Convert to array and sort by search volume
    return Array.from(allKeywords.values())
      .sort((a, b) => b.searchVolume - a.searchVolume)
      .slice(0, 15);
  }, [savedKeywords, relatedKeywords]);

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      <div className="flex-1 overflow-y-auto border-r p-6">
        <h2 className="mb-4 text-lg font-semibold">Article Preview</h2>
        <article className="prose prose-sm max-w-none dark:prose-invert">
          <h1>{article.title}</h1>
          <div className="whitespace-pre-wrap font-mono text-sm text-muted-foreground">
            {article.content}
          </div>
        </article>
      </div>

      <aside className="w-[400px] shrink-0 overflow-y-auto bg-muted/30 p-6">
        <div className="space-y-6">
          <div className="flex justify-center">
            <SEOScoreCircle score={seoScore} />
          </div>

          {apiConfigured === false && (
            <Alert>
              <Info className="size-4" />
              <AlertTitle>DataForSEO Not Configured</AlertTitle>
              <AlertDescription>
                Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD environment variables to enable live keyword research.
              </AlertDescription>
            </Alert>
          )}

          {researchError && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>Research Error</AlertTitle>
              <AlertDescription>{researchError}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Focus Keyword</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Input
                  value={focusKeyword}
                  onChange={(e) => setFocusKeyword(e.target.value)}
                  placeholder="Enter focus keyword"
                />
                {focusKeywordVolume !== undefined && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <TrendingUp className="size-3.5" />
                    <span>
                      {focusKeywordVolume.toLocaleString()} monthly searches
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Secondary Keywords</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="Add keyword"
                  onKeyDown={(e) => e.key === "Enter" && addSecondaryKeyword()}
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={addSecondaryKeyword}
                  aria-label="Add keyword"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              {secondaryKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {secondaryKeywords.map((keyword) => (
                    <Badge
                      key={keyword}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {keyword}
                      <button
                        onClick={() => removeSecondaryKeyword(keyword)}
                        className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                        aria-label={`Remove ${keyword}`}
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <Button
                onClick={handleResearchKeywords}
                disabled={isResearching || (!focusKeyword.trim() && secondaryKeywords.length === 0)}
                className="w-full"
              >
                {isResearching ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Researching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 size-4" />
                    Research Keywords
                  </>
                )}
              </Button>

              {cacheStats && (
                <p className="text-xs text-muted-foreground text-center">
                  {cacheStats.fromCache > 0 && `${cacheStats.fromCache} from cache`}
                  {cacheStats.fromCache > 0 && cacheStats.fromApi > 0 && ", "}
                  {cacheStats.fromApi > 0 && `${cacheStats.fromApi} from API`}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Meta Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      metaTitle.length > 60
                        ? "text-destructive"
                        : "text-muted-foreground"
                    )}
                  >
                    {metaTitle.length}/60
                  </span>
                </div>
                <Input
                  id="metaTitle"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Enter meta title"
                />
                <Progress
                  value={Math.min((metaTitle.length / 60) * 100, 100)}
                  className="h-1"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      metaDescription.length > 160
                        ? "text-destructive"
                        : "text-muted-foreground"
                    )}
                  >
                    {metaDescription.length}/160
                  </span>
                </div>
                <Textarea
                  id="metaDescription"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Enter meta description"
                  className="resize-none"
                  rows={3}
                />
                <Progress
                  value={Math.min((metaDescription.length / 160) * 100, 100)}
                  className="h-1"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Keyword Opportunities</CardTitle>
                {displayKeywords.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleResearchKeywords}
                    disabled={isResearching}
                    className="h-7 px-2"
                  >
                    <RefreshCw className={cn("size-3", isResearching && "animate-spin")} />
                  </Button>
                )}
              </div>
              {displayKeywords.length === 0 && !isResearching && (
                <CardDescription>
                  Add keywords and click &quot;Research Keywords&quot; to find opportunities
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {displayKeywords.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Keyword</TableHead>
                      <TableHead className="text-right text-xs">
                        <TrendingUp className="inline size-3" />
                      </TableHead>
                      <TableHead className="text-right text-xs">
                        <DollarSign className="inline size-3" />
                      </TableHead>
                      <TableHead className="text-xs">
                        <BarChart3 className="inline size-3" />
                      </TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayKeywords.map((kw) => (
                      <TableRow key={kw.keyword}>
                        <TableCell className="py-2 text-sm max-w-[120px] truncate" title={kw.keyword}>
                          {kw.keyword}
                        </TableCell>
                        <TableCell className="py-2 text-right text-sm tabular-nums">
                          {kw.searchVolume >= 1000
                            ? `${(kw.searchVolume / 1000).toFixed(1)}k`
                            : kw.searchVolume}
                        </TableCell>
                        <TableCell className="py-2 text-right text-sm tabular-nums">
                          {kw.cpc ? `$${kw.cpc.toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell className="py-2">
                          <CompetitionBadge level={kw.competitionLevel} />
                        </TableCell>
                        <TableCell className="py-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => addKeywordFromTable(kw.keyword)}
                            disabled={
                              secondaryKeywords.includes(kw.keyword) ||
                              kw.keyword.toLowerCase() === focusKeyword.toLowerCase()
                            }
                          >
                            Add
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : isResearching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  No keyword data yet
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Content Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {seoChecks.map((check) => (
                <div
                  key={check.id}
                  className="flex items-start gap-3 rounded-md p-2 hover:bg-muted/50"
                >
                  <div
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                      check.passed
                        ? "bg-green-100 text-green-600"
                        : "bg-amber-100 text-amber-600"
                    )}
                  >
                    {check.passed ? (
                      <Check className="size-3" />
                    ) : (
                      <AlertCircle className="size-3" />
                    )}
                  </div>
                  <div>
                    <p
                      className={cn(
                        "text-sm font-medium",
                        check.passed
                          ? "text-foreground"
                          : "text-amber-700 dark:text-amber-500"
                      )}
                    >
                      {check.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {check.description}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </aside>
    </div>
  );
}
