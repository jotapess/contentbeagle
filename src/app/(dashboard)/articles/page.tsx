"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Search, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import type { Article, ArticleStatus } from "@/types";
import { mockArticles, mockBrands } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type FilterStatus = "all" | "draft" | "in_review" | "published";

const statusConfig: Record<ArticleStatus, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  editing: {
    label: "Editing",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  seo_review: {
    label: "SEO Review",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  cross_linking: {
    label: "Cross-linking",
    className: "bg-purple-100 text-purple-700 border-purple-200",
  },
  humanizing: {
    label: "Humanizing",
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
  polished: {
    label: "Polished",
    className: "bg-teal-100 text-teal-700 border-teal-200",
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  published: {
    label: "Published",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  archived: {
    label: "Archived",
    className: "bg-gray-100 text-gray-500 border-gray-200",
  },
};

function StatusBadge({ status }: { status: ArticleStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}

function getBrandName(brandId: string): string {
  const brand = mockBrands.find((b) => b.id === brandId);
  return brand?.name ?? "Unknown Brand";
}

function filterByStatus(articles: Article[], filter: FilterStatus): Article[] {
  if (filter === "all") return articles;

  if (filter === "draft") {
    return articles.filter((a) => a.status === "draft");
  }

  if (filter === "in_review") {
    return articles.filter((a) =>
      ["editing", "seo_review", "cross_linking", "humanizing", "polished", "approved"].includes(
        a.status
      )
    );
  }

  if (filter === "published") {
    return articles.filter((a) => a.status === "published");
  }

  return articles;
}

export default function ArticlesPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<FilterStatus>("all");

  const filteredArticles = React.useMemo(() => {
    let result = mockArticles;

    result = filterByStatus(result, statusFilter);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.excerpt?.toLowerCase().includes(query)
      );
    }

    return result.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [searchQuery, statusFilter]);

  const counts = React.useMemo(() => {
    return {
      all: mockArticles.length,
      draft: mockArticles.filter((a) => a.status === "draft").length,
      in_review: mockArticles.filter((a) =>
        ["editing", "seo_review", "cross_linking", "humanizing", "polished", "approved"].includes(
          a.status
        )
      ).length,
      published: mockArticles.filter((a) => a.status === "published").length,
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Articles</h1>
          <p className="text-muted-foreground">
            Create and manage your content across all brands
          </p>
        </div>

        <Button asChild>
          <Link href="/articles/new">
            <Plus className="size-4" />
            New Article
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as FilterStatus)}
        >
          <TabsList>
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="draft">Draft ({counts.draft})</TabsTrigger>
            <TabsTrigger value="in_review">In Review ({counts.in_review})</TabsTrigger>
            <TabsTrigger value="published">Published ({counts.published})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <p className="text-muted-foreground">No articles found</p>
          {(searchQuery || statusFilter !== "all") && (
            <Button
              variant="link"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="mt-2"
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Title</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Words</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[50px]">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArticles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>
                    <Link
                      href={`/articles/${article.id}`}
                      className="block font-medium hover:text-primary hover:underline"
                    >
                      {article.title}
                    </Link>
                    {article.excerpt && (
                      <p className="mt-0.5 truncate text-sm text-muted-foreground max-w-md">
                        {article.excerpt}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{getBrandName(article.brandId)}</span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={article.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {article.wordCount?.toLocaleString() ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(article.updatedAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label="Article actions"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/articles/${article.id}`}>
                            <Pencil className="size-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        {article.publishedUrl && (
                          <DropdownMenuItem asChild>
                            <a
                              href={article.publishedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Eye className="size-4" />
                              View Published
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          <Trash2 className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
