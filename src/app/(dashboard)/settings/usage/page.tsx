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
  Loader2,
} from "lucide-react";

import { getUserTeams, getTeamUsage } from "@/lib/actions";
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

interface UsageLog {
  id: string;
  team_id: string;
  user_id: string | null;
  provider: string;
  model: string;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  feature: string;
  article_id: string | null;
  estimated_cost: number | null;
  created_at: string | null;
}

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

function getDateRange(range: string): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = now.toISOString();
  let startDate: Date;

  switch (range) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "last_7_days":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "this_month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "last_30_days":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "last_90_days":
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { startDate: startDate.toISOString(), endDate };
}

export default function UsagePage() {
  const [dateRange, setDateRange] = React.useState("this_month");
  const [isLoading, setIsLoading] = React.useState(true);
  const [usageData, setUsageData] = React.useState<UsageLog[]>([]);
  const [totals, setTotals] = React.useState({
    totalTokens: 0,
    totalCost: 0,
    requestCount: 0,
    byProvider: {} as Record<string, { tokens: number; cost: number; count: number }>,
    byOperation: {} as Record<string, { tokens: number; cost: number; count: number }>,
  });

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);

      // Get user's team
      const teamsResult = await getUserTeams();
      if (!teamsResult.data || teamsResult.data.length === 0) {
        setIsLoading(false);
        return;
      }

      const teamId = teamsResult.data[0].id;
      const { startDate, endDate } = getDateRange(dateRange);

      // Get usage data
      const usageResult = await getTeamUsage(teamId, { startDate, endDate });
      if (usageResult.data) {
        setUsageData(usageResult.data.logs || []);
        setTotals(usageResult.data.totals);
      }

      setIsLoading(false);
    }

    loadData();
  }, [dateRange]);

  const uniqueArticles = new Set(
    usageData.filter((u) => u.article_id).map((u) => u.article_id)
  ).size;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
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
              {formatNumber(totals.totalTokens)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totals.requestCount} API requests
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
              ${totals.totalCost.toFixed(2)}
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
            <div className="text-3xl font-bold">{uniqueArticles}</div>
            <p className="text-xs text-muted-foreground">
              Across {Object.keys(totals.byOperation).length} features
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
            {Object.entries(totals.byProvider)
              .sort((a, b) => b[1].tokens - a[1].tokens)
              .map(([provider, data]) => (
                <UsageBar
                  key={provider}
                  provider={provider}
                  percentage={totals.totalTokens > 0 ? (data.tokens / totals.totalTokens) * 100 : 0}
                  tokens={data.tokens}
                  cost={data.cost}
                />
              ))}

            {Object.keys(totals.byProvider).length === 0 && (
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
              {Object.entries(totals.byOperation)
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

              {Object.keys(totals.byOperation).length === 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  No usage data available
                </p>
              )}
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
          {usageData.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No usage data yet. Generate some content to see your usage here.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
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
                      new Date(b.created_at || 0).getTime() -
                      new Date(a.created_at || 0).getTime()
                  )
                  .slice(0, 20)
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
                              {log.created_at ? new Date(log.created_at).toLocaleDateString() : "-"}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {log.created_at ? new Date(log.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            }) : ""}
                          </span>
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
                          {formatNumber(log.total_tokens || 0)}
                          <span className="block text-xs text-muted-foreground">
                            {formatNumber(log.input_tokens || 0)}in / {formatNumber(log.output_tokens || 0)}out
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          ${(log.estimated_cost || 0).toFixed(4)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          )}
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
