"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Brain,
  Building2,
  FileText,
  Globe,
  Layers,
  Loader2,
  Pencil,
  RefreshCw,
  Settings,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  getBrand,
  getArticles,
  getCrawledPages,
  analyzeBrandVoice,
  canAnalyzeBrand,
  getCrawlJobs,
} from "@/lib/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  crawling: {
    label: "Crawling",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  analyzing: {
    label: "Analyzing",
    className: "bg-purple-100 text-purple-800 border-purple-200",
  },
  active: {
    label: "Active",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  ready: {
    label: "Ready",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  error: {
    label: "Error",
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

const articleStatusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  editing: "bg-blue-100 text-blue-700",
  seo_review: "bg-purple-100 text-purple-700",
  cross_linking: "bg-indigo-100 text-indigo-700",
  humanizing: "bg-amber-100 text-amber-700",
  polished: "bg-teal-100 text-teal-700",
  approved: "bg-green-100 text-green-700",
  published: "bg-emerald-100 text-emerald-700",
  archived: "bg-slate-100 text-slate-700",
};

interface BrandData {
  id: string;
  name: string;
  website_url: string | null;
  logo_url: string | null;
  industry: string | null;
  description: string | null;
  target_audience: string | null;
  status: string;
  team_id: string;
  brand_profile?: {
    voice_description: string | null;
    confidence_score: number | null;
    tone_formality: number | null;
    tone_enthusiasm: number | null;
  } | null;
}

export default function BrandOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.brandId as string;

  const [brand, setBrand] = React.useState<BrandData | null>(null);
  const [articles, setArticles] = React.useState<unknown[]>([]);
  const [crawledPages, setCrawledPages] = React.useState<unknown[]>([]);
  const [analysisStatus, setAnalysisStatus] = React.useState<{
    canAnalyze: boolean;
    pagesCount: number;
    hasExistingProfile: boolean;
  } | null>(null);
  const [crawlJob, setCrawlJob] = React.useState<{
    id: string;
    status: string;
    progress?: number;
    total?: number;
    crawledUrls?: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isPolling, setIsPolling] = React.useState(false);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [analysisError, setAnalysisError] = React.useState<string | null>(null);
  const [analysisSuccess, setAnalysisSuccess] = React.useState(false);

  // Load data
  const loadData = React.useCallback(async () => {
    try {
      const [brandResult, analysisCheck, crawlJobsResult] = await Promise.all([
        getBrand(brandId),
        canAnalyzeBrand(brandId),
        getCrawlJobs(brandId),
      ]);

      if (brandResult.data) {
        setBrand(brandResult.data as unknown as BrandData);

        // Get articles and crawled pages using team_id
        const [articlesResult, pagesResult] = await Promise.all([
          getArticles(brandResult.data.team_id, { brandId, limit: 5 }),
          getCrawledPages(brandId),
        ]);

        if (articlesResult.data) setArticles(articlesResult.data);
        if (pagesResult.data) setCrawledPages(pagesResult.data);
      }

      setAnalysisStatus(analysisCheck);

      // Check for active crawl job
      if (crawlJobsResult.data && crawlJobsResult.data.length > 0) {
        const activeJob = crawlJobsResult.data.find(
          (job) => job.status === "pending" || job.status === "scraping" || job.status === "in_progress"
        );
        if (activeJob) {
          setCrawlJob({
            id: activeJob.id,
            status: activeJob.status,
            progress: activeJob.pages_crawled || 0,
            total: activeJob.max_pages || undefined,
          });
        } else {
          setCrawlJob(null);
        }
      }
    } catch (error) {
      console.error("Error loading brand data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [brandId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Poll for updates if crawling
  React.useEffect(() => {
    if (!crawlJob) return;
    if (crawlJob.status === "completed" || crawlJob.status === "failed" || crawlJob.status === "cancelled") return;

    const pollCrawlProgress = async () => {
      if (isPolling) return;
      setIsPolling(true);

      try {
        const response = await fetch("/api/crawl/poll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: crawlJob.id }),
        });

        if (response.ok) {
          const result = await response.json();
          setCrawlJob((prev) =>
            prev
              ? {
                  ...prev,
                  status: result.status,
                  progress: result.progress,
                  total: result.total,
                  crawledUrls: result.crawledUrls || [],
                }
              : null
          );

          // If completed, reload all data
          if (result.completed) {
            await loadData();
          }
        }
      } catch (error) {
        console.error("Error polling crawl status:", error);
      } finally {
        setIsPolling(false);
      }
    };

    // Poll every 3 seconds
    const interval = setInterval(pollCrawlProgress, 3000);
    // Also poll immediately
    pollCrawlProgress();

    return () => clearInterval(interval);
  }, [crawlJob?.id, crawlJob?.status, isPolling, loadData]);

  const handleAnalyzeBrand = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisSuccess(false);

    try {
      const result = await analyzeBrandVoice(brandId);

      if (result.success) {
        setAnalysisSuccess(true);
        // Reload data to get updated profile
        await loadData();
      } else {
        setAnalysisError(result.error || "Analysis failed");
      }
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Brand not found</p>
        <Button asChild variant="link" className="mt-2">
          <Link href="/brands">Back to Brands</Link>
        </Button>
      </div>
    );
  }

  const status = statusConfig[brand.status] || statusConfig.pending;
  const brandScore = brand.brand_profile?.confidence_score != null
    ? Math.round(brand.brand_profile.confidence_score * 100)
    : null;

  const showAnalysisButton = analysisStatus?.canAnalyze && !crawlJob;
  const showCrawlProgress = crawlJob && (crawlJob.status === "pending" || crawlJob.status === "scraping" || crawlJob.status === "in_progress");

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="-ml-2"
      >
        <Link href="/brands">
          <ArrowLeft className="size-4" />
          Back to Brands
        </Link>
      </Button>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
            {brand.logo_url ? (
              <Image
                src={brand.logo_url}
                alt={`${brand.name} logo`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <Building2 className="size-8 text-muted-foreground" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{brand.name}</h1>
              <Badge
                variant="outline"
                className={cn("shrink-0", status.className)}
              >
                {status.label}
              </Badge>
            </div>

            {brand.website_url && (
              <a
                href={brand.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <Globe className="size-4" />
                {brand.website_url.replace(/^https?:\/\//, "")}
              </a>
            )}

            {brand.industry && (
              <Badge variant="secondary" className="mt-2">
                {brand.industry}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/brands/${brandId}/settings`}>
              <Settings className="size-4" />
              Settings
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/brands/${brandId}/profile`}>
              <Pencil className="size-4" />
              Edit Profile
            </Link>
          </Button>
        </div>
      </div>

      {/* Crawl Progress */}
      {showCrawlProgress && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Loader2 className="size-4 animate-spin" />
              Crawling Website
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We&apos;re crawling your website to analyze your brand voice...
            </p>

            {/* Progress bar */}
            <div className="space-y-2">
              <Progress
                value={crawlJob.total ? ((crawlJob.progress || 0) / crawlJob.total) * 100 : 0}
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{crawlJob.progress || 0} of {crawlJob.total || '?'} pages crawled</span>
                <span className="capitalize">{crawlJob.status.replace(/_/g, ' ')}</span>
              </div>
            </div>

            {/* Crawled URLs list */}
            {crawlJob.crawledUrls && crawlJob.crawledUrls.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Recently crawled:</p>
                <div className="max-h-32 overflow-y-auto rounded-md border bg-muted/50 p-2">
                  <ul className="space-y-1 text-xs">
                    {crawlJob.crawledUrls.slice(0, 10).map((url, i) => (
                      <li key={i} className="flex items-center gap-2 truncate text-muted-foreground">
                        <Globe className="size-3 shrink-0 text-green-500" />
                        <span className="truncate">{url.replace(/^https?:\/\//, '')}</span>
                      </li>
                    ))}
                    {crawlJob.crawledUrls.length > 10 && (
                      <li className="text-muted-foreground/60">
                        +{crawlJob.crawledUrls.length - 10} more pages...
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analysis Success */}
      {analysisSuccess && (
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
          <Sparkles className="size-4" />
          <AlertTitle>Analysis Complete!</AlertTitle>
          <AlertDescription>
            Your brand voice has been analyzed. View your{" "}
            <Link href={`/brands/${brandId}/profile`} className="font-medium underline underline-offset-2">
              brand profile
            </Link>{" "}
            to see the results.
          </AlertDescription>
        </Alert>
      )}

      {/* Analysis Error */}
      {analysisError && (
        <Alert variant="destructive">
          <AlertTitle>Analysis Failed</AlertTitle>
          <AlertDescription>{analysisError}</AlertDescription>
        </Alert>
      )}

      {/* Brand Analysis Card */}
      {showAnalysisButton && !brand.brand_profile?.voice_description && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Brain className="mb-4 size-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Ready for Brand Analysis</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              We&apos;ve crawled {analysisStatus.pagesCount} pages from your website.
              Run AI analysis to extract your brand voice, tone, and style guidelines.
            </p>
            <Button
              onClick={handleAnalyzeBrand}
              disabled={isAnalyzing}
              className="mt-4"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Analyze Brand Voice
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Re-analyze option if profile exists */}
      {brand.brand_profile?.voice_description && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span>Brand Voice Summary</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAnalyzeBrand}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                Re-analyze
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {brand.brand_profile.voice_description}
            </p>
            {brandScore !== null && (
              <div className="mt-4 flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Confidence:</span>
                <Progress value={brandScore} className="h-2 w-24" />
                <span className="font-medium">{brandScore}%</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Articles</CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{articles.length}</div>
            <p className="text-xs text-muted-foreground">
              Total articles created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Crawled Pages</CardTitle>
            <Layers className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crawledPages.length}</div>
            <p className="text-xs text-muted-foreground">
              Pages analyzed for brand voice
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Brand Score</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {brandScore !== null ? `${brandScore}%` : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              Profile confidence score
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Articles</span>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/articles?brand=${brandId}`}>View all</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {articles.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">No articles yet</p>
                <Button asChild variant="link" className="mt-2">
                  <Link href={`/articles/new?brand=${brandId}`}>
                    Create your first article
                  </Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y">
                {(articles as Array<{
                  id: string;
                  title: string;
                  word_count?: number;
                  status: string;
                }>).map((article) => (
                  <li key={article.id} className="py-3 first:pt-0 last:pb-0">
                    <Link
                      href={`/articles/${article.id}`}
                      className="group flex items-start justify-between gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium group-hover:text-primary">
                          {article.title}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {article.word_count?.toLocaleString() || 0} words
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "shrink-0 text-xs",
                          articleStatusColors[article.status]
                        )}
                      >
                        {article.status.replace(/_/g, " ")}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              asChild
            >
              <Link href={`/brands/${brandId}/profile`}>
                <Brain className="size-4" />
                Brand Profile
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              asChild
            >
              <Link href={`/brands/${brandId}/crawled`}>
                <Layers className="size-4" />
                Crawled Pages
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              asChild
            >
              <Link href={`/brands/${brandId}/settings`}>
                <Settings className="size-4" />
                Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {brand.description && (
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{brand.description}</p>
            {brand.target_audience && (
              <div className="mt-4">
                <p className="text-sm font-medium">Target Audience</p>
                <p className="text-sm text-muted-foreground">
                  {brand.target_audience}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
