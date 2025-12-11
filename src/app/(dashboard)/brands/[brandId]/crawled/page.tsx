"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { getBrand, getCrawledPages } from "@/lib/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CrawledPage {
  id: string;
  brand_id: string;
  url: string;
  title: string | null;
  content_type: string | null;
  word_count: number | null;
  summary: string | null;
  key_topics: string[] | null;
  target_keywords: string[] | null;
  meta_description: string | null;
  crawled_at: string | null;
}

interface Brand {
  id: string;
  name: string;
}

interface ExpandedRowProps {
  page: CrawledPage;
}

function ExpandedRowContent({ page }: ExpandedRowProps) {
  return (
    <div className="space-y-4 p-4 bg-muted/30">
      {page.summary && (
        <div>
          <h4 className="text-sm font-medium mb-1">Summary</h4>
          <p className="text-sm text-muted-foreground">{page.summary}</p>
        </div>
      )}

      {page.key_topics && page.key_topics.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Key Topics</h4>
          <div className="flex flex-wrap gap-1.5">
            {page.key_topics.map((topic, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {topic}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {page.target_keywords && page.target_keywords.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Target Keywords</h4>
          <div className="flex flex-wrap gap-1.5">
            {page.target_keywords.map((keyword, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
              >
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {page.meta_description && (
        <div>
          <h4 className="text-sm font-medium mb-1">Meta Description</h4>
          <p className="text-sm text-muted-foreground">{page.meta_description}</p>
        </div>
      )}

      <div className="flex items-center gap-4 pt-2">
        <a
          href={page.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ExternalLink className="size-3.5" />
          Visit Page
        </a>
      </div>
    </div>
  );
}

export default function CrawledPagesPage() {
  const params = useParams();
  const brandId = params.brandId as string;

  const [brand, setBrand] = React.useState<Brand | null>(null);
  const [crawledPages, setCrawledPages] = React.useState<CrawledPage[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());
  const [recrawlingIds, setRecrawlingIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);

      const [brandResult, pagesResult] = await Promise.all([
        getBrand(brandId),
        getCrawledPages(brandId),
      ]);

      if (brandResult.data) {
        setBrand(brandResult.data);
      }

      if (pagesResult.data) {
        setCrawledPages(pagesResult.data);
      }

      setIsLoading(false);
    }

    loadData();
  }, [brandId]);

  const filteredPages = React.useMemo(() => {
    if (!searchQuery.trim()) return crawledPages;

    const query = searchQuery.toLowerCase();
    return crawledPages.filter(
      (page) =>
        page.url.toLowerCase().includes(query) ||
        page.title?.toLowerCase().includes(query) ||
        page.content_type?.toLowerCase().includes(query)
    );
  }, [crawledPages, searchQuery]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRecrawl = async (pageId: string) => {
    setRecrawlingIds((prev) => new Set(prev).add(pageId));
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setRecrawlingIds((prev) => {
      const next = new Set(prev);
      next.delete(pageId);
      return next;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const contentTypeColors: Record<string, string> = {
    homepage: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    product: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    blog: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    about: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    service: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
            <Link href={`/brands/${brandId}`}>
              <ArrowLeft className="size-4" />
              Back to {brand.name}
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Crawled Pages</h1>
          <p className="text-muted-foreground">
            Pages analyzed for {brand.name}&apos;s brand voice
          </p>
        </div>

        <Button>
          <Plus className="size-4" />
          Crawl New URLs
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
            <Globe className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crawledPages.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Words</CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {crawledPages
                .reduce((acc, page) => acc + (page.word_count || 0), 0)
                .toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Last Crawled</CardTitle>
            <RefreshCw className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {crawledPages.length > 0 && crawledPages[0].crawled_at
                ? formatDate(
                    crawledPages.sort(
                      (a, b) =>
                        new Date(b.crawled_at || 0).getTime() -
                        new Date(a.crawled_at || 0).getTime()
                    )[0].crawled_at!
                  )
                : "Never"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filteredPages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="size-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              {searchQuery ? "No pages match your search" : "No pages crawled yet"}
            </p>
            {!searchQuery && (
              <Button className="mt-4">
                <Plus className="size-4" />
                Crawl URLs
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>URL / Title</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="hidden md:table-cell">Words</TableHead>
                <TableHead className="hidden lg:table-cell">Crawled</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPages.map((page) => {
                const isExpanded = expandedRows.has(page.id);
                const isRecrawling = recrawlingIds.has(page.id);

                return (
                  <React.Fragment key={page.id}>
                    <TableRow
                      className={cn(
                        "cursor-pointer",
                        isExpanded && "border-b-0"
                      )}
                      onClick={() => toggleRow(page.id)}
                    >
                      <TableCell className="pr-0">
                        <Button variant="ghost" size="icon-sm" tabIndex={-1}>
                          {isExpanded ? (
                            <ChevronUp className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {page.title || "Untitled"}
                          </p>
                          <p className="truncate text-sm text-muted-foreground">
                            {page.url.replace(/^https?:\/\//, "")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {page.content_type && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs capitalize",
                              contentTypeColors[page.content_type] ||
                                "bg-gray-100 text-gray-700"
                            )}
                          >
                            {page.content_type}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {page.word_count?.toLocaleString() || "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {page.crawled_at ? formatDate(page.crawled_at) : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRecrawl(page.id);
                          }}
                          disabled={isRecrawling}
                        >
                          {isRecrawling ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <RefreshCw className="size-4" />
                          )}
                          <span className="sr-only sm:not-sr-only sm:ml-2">
                            Recrawl
                          </span>
                        </Button>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={6} className="p-0">
                          <ExpandedRowContent page={page} />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
