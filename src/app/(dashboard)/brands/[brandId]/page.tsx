"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  FileText,
  Globe,
  Layers,
  Pencil,
  Settings,
  TrendingUp,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  getBrandById,
  getBrandProfile,
  getArticlesByBrand,
  getCrawledPagesByBrand,
} from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export default function BrandOverviewPage() {
  const params = useParams();
  const brandId = params.brandId as string;

  const brand = getBrandById(brandId);
  const profile = getBrandProfile(brandId);
  const articles = getArticlesByBrand(brandId);
  const crawledPages = getCrawledPagesByBrand(brandId);

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

  const status = statusConfig[brand.status];
  const recentArticles = articles.slice(0, 5);
  const brandScore = profile?.confidenceScore != null
    ? Math.round(profile.confidenceScore * 100)
    : null;

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
            {brand.logoUrl ? (
              <Image
                src={brand.logoUrl}
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

            {brand.websiteUrl && (
              <a
                href={brand.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <Globe className="size-4" />
                {brand.websiteUrl.replace(/^https?:\/\//, "")}
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
            {recentArticles.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No articles yet
              </p>
            ) : (
              <ul className="divide-y">
                {recentArticles.map((article) => (
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
                          {article.wordCount?.toLocaleString() || 0} words
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
                <User className="size-4" />
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
            {brand.targetAudience && (
              <div className="mt-4">
                <p className="text-sm font-medium">Target Audience</p>
                <p className="text-sm text-muted-foreground">
                  {brand.targetAudience}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
