"use server";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type AIUsageLog = Tables<"ai_usage_log">;

export interface UsageData {
  teamId: string;
  articleId?: string;
  provider: string;
  model: string;
  feature: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost?: number;
}

// Log AI usage
export async function trackAIUsage(data: UsageData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.from("ai_usage_log").insert({
    team_id: data.teamId,
    article_id: data.articleId,
    provider: data.provider,
    model: data.model,
    feature: data.feature,
    input_tokens: data.inputTokens,
    output_tokens: data.outputTokens,
    total_tokens: data.totalTokens,
    estimated_cost: data.estimatedCost,
    user_id: user.id,
  });

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}

// Get usage statistics for a team
export async function getTeamUsage(teamId: string, options?: {
  startDate?: string;
  endDate?: string;
  groupBy?: "day" | "week" | "month";
}) {
  const supabase = await createClient();

  let query = supabase
    .from("ai_usage_log")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (options?.startDate) {
    query = query.gte("created_at", options.startDate);
  }

  if (options?.endDate) {
    query = query.lte("created_at", options.endDate);
  }

  const { data, error } = await query;

  if (error) return { data: null, error: error.message };

  // Calculate totals
  const totals = {
    totalTokens: 0,
    totalCost: 0,
    requestCount: data?.length || 0,
    byProvider: {} as Record<string, { tokens: number; cost: number; count: number }>,
    byOperation: {} as Record<string, { tokens: number; cost: number; count: number }>,
  };

  for (const log of data || []) {
    totals.totalTokens += log.total_tokens || 0;
    totals.totalCost += log.estimated_cost || 0;

    // By provider
    const provider = log.provider || "unknown";
    if (!totals.byProvider[provider]) {
      totals.byProvider[provider] = { tokens: 0, cost: 0, count: 0 };
    }
    totals.byProvider[provider].tokens += log.total_tokens || 0;
    totals.byProvider[provider].cost += log.estimated_cost || 0;
    totals.byProvider[provider].count += 1;

    // By feature
    const feature = log.feature || "unknown";
    if (!totals.byOperation[feature]) {
      totals.byOperation[feature] = { tokens: 0, cost: 0, count: 0 };
    }
    totals.byOperation[feature].tokens += log.total_tokens || 0;
    totals.byOperation[feature].cost += log.estimated_cost || 0;
    totals.byOperation[feature].count += 1;
  }

  return { data: { logs: data, totals }, error: null };
}

// Get usage for a specific article
export async function getArticleUsage(articleId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_usage_log")
    .select("*")
    .eq("article_id", articleId)
    .order("created_at", { ascending: true });

  if (error) return { data: null, error: error.message };

  const totals = {
    totalTokens: data?.reduce((sum, log) => sum + (log.total_tokens || 0), 0) || 0,
    totalCost: data?.reduce((sum, log) => sum + (log.estimated_cost || 0), 0) || 0,
  };

  return { data: { logs: data, totals }, error: null };
}

// Estimate cost for tokens
export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  // Cost per 1K tokens (input/output)
  const costs: Record<string, { input: number; output: number }> = {
    "openai:gpt-4o": { input: 0.005, output: 0.015 },
    "openai:gpt-4o-mini": { input: 0.00015, output: 0.0006 },
    "anthropic:claude-sonnet-4-20250514": { input: 0.003, output: 0.015 },
    "anthropic:claude-opus-4-5-20251101": { input: 0.015, output: 0.075 },
    "google:gemini-1.5-pro": { input: 0.00125, output: 0.005 },
  };

  const modelCosts = costs[model] || { input: 0.001, output: 0.002 };

  return (
    (inputTokens / 1000) * modelCosts.input +
    (outputTokens / 1000) * modelCosts.output
  );
}
