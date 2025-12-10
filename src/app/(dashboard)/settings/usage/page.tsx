"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Coins,
  FileText,
  Zap,
  Calendar,
  Clock,
  TrendingUp,
} from "lucide-react";

import type { AIUsageLog } from "@/types";
import { mockUsageData, mockUsers, mockArticles, mockBrands } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const extendedUsageData: AIUsageLog[] = [
  ...mockUsageData,
  {
    id: "usage-4",
    teamId: "team-1",
    userId: "user-1",
    provider: "openai",
    model: "gpt-4o",
    inputTokens: 1500,
    outputTokens: 2000,
    totalTokens: 3500,
    feature: "seo_optimization",
    articleId: "article-1",
    brandId: "brand-1",
    estimatedCost: 0.0175,
    createdAt: "2024-03-06T15:30:00Z",
  },
  {
    id: "usage-5",
    teamId: "team-1",
    userId: "user-2",
    provider: "openai",
    model: "gpt-4o",
    inputTokens: 800,
    outputTokens: 1200,
    totalTokens: 2000,
    feature: "brand_analysis",
    articleId: null,
    brandId: "brand-2",
    estimatedCost: 0.01,
    createdAt: "2024-03-05T10:00:00Z",
  },
  {
    id: "usage-6",
    teamId: "team-1",
    userId: "user-1",
    provider: "anthropic",
    model: "claude-3-5-sonnet-20241022",
    inputTokens: 2200,
    outputTokens: 2800,
    totalTokens: 5000,
    feature: "content_generation",
    articleId: "article-3",
    brandId: "brand-2",
    estimatedCost: 0.015,
    createdAt: "2024-03-04T09:00:00Z",
  },
  {
    id: "usage-7",
    teamId: "team-1",
    userId: "user-1",
    provider: "openai",
    model: "gpt-4o",
    inputTokens: 500,
    outputTokens: 800,
    totalTokens: 1300,
    feature: "cross_linking",
    articleId: "article-2",
    brandId: "brand-1",
    estimatedCost: 0.0065,
    createdAt: "2024-03-03T14:00:00Z",
  },
];

const featureLabels: Record<string, { label: string; color: string }> = {
  content_generation: {
    label: "Content Generation",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  humanization: {
    label: "Humanization",
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  seo_optimization: {
    label: "SEO Optimization",
    color: "bg-green-100 text-green-700 border-green-200",
  },
  brand_analysis: {
    label: "Brand Analysis",
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  cross_linking: {
    label: "Cross-linking",
    color: "bg-pink-100 text-pink-700 border-pink-200",
  },
};

const providerColors: Record<string, string> = {
  openai: "bg-emerald-500",
  anthropic: "bg-orange-500",
  google: "bg-blue-500",
};

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

function UsageBar({
  provider,
  percentage,
  tokens,
  cost,
}: {
  provider: string;
  percentage: number;
  tokens: number;
  cost: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium capitalize">{provider}</span>
        <span className="text-muted-foreground">
          {formatNumber(tokens)} tokens ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full transition-all", providerColors[provider] || "bg-gray-500")}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Est. cost: ${cost.toFixed(4)}
      </p>
    </div>
  );
}

export default function UsagePage() {
  const [dateRange, setDateRange] = React.useState("this_month");
  const [usageData] = React.useState<AIUsageLog[]>(extendedUsageData);

  const stats = React.useMemo(() => {
    const totalTokens = usageData.reduce((sum, u) => sum + u.totalTokens, 0);
    const totalCost = usageData.reduce((sum, u) => sum + u.estimatedCost, 0);
    const uniqueArticles = new Set(usageData.filter((u) => u.articleId).map((u) => u.articleId)).size;

    const byProvider: Record<string, { tokens: number; cost: number }> = {};
    usageData.forEach((u) => {
      if (!byProvider[u.provider]) {
        byProvider[u.provider] = { tokens: 0, cost: 0 };
      }
      byProvider[u.provider].tokens += u.totalTokens;
      byProvider[u.provider].cost += u.estimatedCost;
    });

    const byFeature: Record<string, { count: number; tokens: number }> = {};
    usageData.forEach((u) => {
      if (!byFeature[u.feature]) {
        byFeature[u.feature] = { count: 0, tokens: 0 };
      }
      byFeature[u.feature].count += 1;
      byFeature[u.feature].tokens += u.totalTokens;
    });

    return { totalTokens, totalCost, uniqueArticles, byProvider, byFeature };
  }, [usageData]);

  function getUserName(userId: string): string {
    const user = mockUsers.find((u) => u.id === userId);
    return user?.fullName || "Unknown";
  }

  function getArticleTitle(articleId: string | null): string {
    if (!articleId) return "-";
    const article = mockArticles.find((a) => a.id === articleId);
    return article?.title || "Unknown";
  }

  function getBrandName(brandId: string | null): string {
    if (!brandId) return "-";
    const brand = mockBrands.find((b) => b.id === brandId);
    return brand?.name || "Unknown";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings">
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back to Settings</span>
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Usage Analytics</h1>
          <p className="text-muted-foreground">
            Track your AI usage and costs across providers
          </p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="mr-2 size-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="last_7_days">Last 7 days</SelectItem>
            <SelectItem value="this_month">This month</SelectItem>
            <SelectItem value="last_30_days">Last 30 days</SelectItem>
            <SelectItem value="last_90_days">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Zap className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatNumber(stats.totalTokens)}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <Coins className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${stats.totalCost.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Estimated based on provider rates
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Articles Generated
            </CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.uniqueArticles}</div>
            <p className="text-xs text-muted-foreground">
              Across {Object.keys(stats.byFeature).length} features
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Usage by Provider</CardTitle>
            <CardDescription>
              Token distribution across AI providers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(stats.byProvider)
              .sort((a, b) => b[1].tokens - a[1].tokens)
              .map(([provider, data]) => (
                <UsageBar
                  key={provider}
                  provider={provider}
                  percentage={(data.tokens / stats.totalTokens) * 100}
                  tokens={data.tokens}
                  cost={data.cost}
                />
              ))}

            {Object.keys(stats.byProvider).length === 0 && (
              <p className="text-center text-sm text-muted-foreground">
                No usage data available
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage by Feature</CardTitle>
            <CardDescription>
              How tokens are used across features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.byFeature)
                .sort((a, b) => b[1].tokens - a[1].tokens)
                .map(([feature, data]) => {
                  const featureConfig = featureLabels[feature] || {
                    label: feature,
                    color: "bg-gray-100 text-gray-700",
                  };
                  return (
                    <div
                      key={feature}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={cn("text-xs", featureConfig.color)}
                        >
                          {featureConfig.label}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatNumber(data.tokens)} tokens
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {data.count} request{data.count !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Usage Log</CardTitle>
              <CardDescription>
                Detailed log of AI API calls
              </CardDescription>
            </div>
            <Badge variant="secondary">{usageData.length} requests</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Feature</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usageData
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                )
                .map((log) => {
                  const featureConfig = featureLabels[log.feature] || {
                    label: log.feature,
                    color: "bg-gray-100 text-gray-700",
                  };

                  return (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="size-3 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{getUserName(log.userId)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("text-xs", featureConfig.color)}
                        >
                          {featureConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">{log.provider}</span>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">{log.model}</code>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(log.totalTokens)}
                        <span className="block text-xs text-muted-foreground">
                          {formatNumber(log.inputTokens)}in / {formatNumber(log.outputTokens)}out
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        ${log.estimatedCost.toFixed(4)}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="size-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Need more detailed analytics?</p>
              <p className="text-sm text-muted-foreground">
                Export your usage data or upgrade to Enterprise for advanced reporting.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Export CSV</Button>
            <Button>Upgrade Plan</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
