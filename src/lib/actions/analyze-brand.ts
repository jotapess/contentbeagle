"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  extractBrandProfile,
  getRecommendedModelForExtraction,
  MIN_PAGES_FOR_ANALYSIS,
  type CrawledPageContent,
} from "@/lib/ai/brand-extraction";
import { SUPPORTED_MODELS } from "@/lib/ai/provider-registry";
import { getDecryptedAPIKeys } from "./api-keys";
import type { BrandVoiceAnalysisResult } from "@/lib/ai/prompts/brand-voice-analysis";

export interface AnalyzeBrandResult {
  success: boolean;
  profile?: {
    id: string;
    voiceDescription: string | null;
    toneFormality: number | null;
    toneEnthusiasm: number | null;
    toneHumor: number | null;
    toneConfidence: number | null;
    toneEmpathy: number | null;
    confidenceScore: number | null;
    sourcePagesCount: number | null;
  };
  analysis?: BrandVoiceAnalysisResult;
  tokensUsed?: {
    input: number;
    output: number;
    total: number;
  };
  error?: string;
  warnings?: string[];
}

/**
 * Analyze brand voice from crawled pages
 * Requires at least MIN_PAGES_FOR_ANALYSIS crawled pages
 */
export async function analyzeBrandVoice(
  brandId: string,
  options?: {
    modelId?: string;
    forceReanalyze?: boolean;
  }
): Promise<AnalyzeBrandResult> {
  const supabase = await createClient();
  const warnings: string[] = [];

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get brand details
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("*, team_id")
    .eq("id", brandId)
    .single();

  if (brandError || !brand) {
    return { success: false, error: "Brand not found" };
  }

  // Check if we should skip analysis (already have profile)
  if (!options?.forceReanalyze) {
    const { data: existingProfile } = await supabase
      .from("brand_profiles")
      .select("id, confidence_score")
      .eq("brand_id", brandId)
      .eq("is_active", true)
      .single();

    if (existingProfile && existingProfile.confidence_score && existingProfile.confidence_score > 0.5) {
      warnings.push("Brand already has a profile. Use forceReanalyze to update.");
    }
  }

  // Get crawled pages for this brand
  const { data: crawledPages, error: pagesError } = await supabase
    .from("crawled_pages")
    .select("url, title, markdown_content")
    .eq("brand_id", brandId)
    .eq("is_active", true)
    .not("markdown_content", "is", null)
    .order("crawled_at", { ascending: false })
    .limit(15);

  if (pagesError) {
    return { success: false, error: `Failed to get crawled pages: ${pagesError.message}` };
  }

  if (!crawledPages || crawledPages.length === 0) {
    return { success: false, error: "No crawled pages found. Please crawl the website first." };
  }

  if (crawledPages.length < MIN_PAGES_FOR_ANALYSIS) {
    warnings.push(
      `Only ${crawledPages.length} pages available for analysis. ` +
      `For best results, ${MIN_PAGES_FOR_ANALYSIS}+ pages recommended.`
    );
  }

  // Prepare page content
  const pages: CrawledPageContent[] = crawledPages.map(page => ({
    url: page.url,
    title: page.title || "",
    content: page.markdown_content || "",
  }));

  // Get user's API key for the model
  const recommendedModel = getRecommendedModelForExtraction();
  const fullModelId = options?.modelId || recommendedModel.id;
  const modelInfo = SUPPORTED_MODELS.find(m => m.id === fullModelId);

  if (!modelInfo) {
    return { success: false, error: `Unknown model: ${fullModelId}` };
  }

  // Get API key using the existing getDecryptedAPIKeys function
  const { data: apiKeys, error: keysError } = await getDecryptedAPIKeys(brand.team_id);

  if (keysError) {
    return { success: false, error: `Failed to get API keys: ${keysError}` };
  }

  // Get the API key for the model's provider
  const apiKey = apiKeys?.[modelInfo.provider as keyof typeof apiKeys];

  if (!apiKey) {
    return {
      success: false,
      error: `No API key found for ${modelInfo.provider}. Please add your API key in Settings.`,
    };
  }

  // Run brand extraction
  const result = await extractBrandProfile({
    brandId,
    brandName: brand.name,
    industry: brand.industry || undefined,
    pages,
    modelId: fullModelId,
    apiKey,
  });

  if (!result.success || !result.profile) {
    return {
      success: false,
      error: result.error || "Brand analysis failed",
      tokensUsed: result.tokensUsed,
    };
  }

  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from("brand_profiles")
    .select("id, version")
    .eq("brand_id", brandId)
    .eq("is_active", true)
    .single();

  let profileId: string;

  if (existingProfile) {
    // Deactivate old profile
    await supabase
      .from("brand_profiles")
      .update({ is_active: false })
      .eq("id", existingProfile.id);

    // Create new profile with incremented version
    const { data: newProfile, error: insertError } = await supabase
      .from("brand_profiles")
      .insert({
        ...result.profile,
        version: (existingProfile.version || 0) + 1,
      })
      .select("id")
      .single();

    if (insertError || !newProfile) {
      return {
        success: false,
        error: `Failed to save brand profile: ${insertError?.message}`,
        tokensUsed: result.tokensUsed,
      };
    }

    profileId = newProfile.id;
  } else {
    // Create first profile
    const { data: newProfile, error: insertError } = await supabase
      .from("brand_profiles")
      .insert(result.profile)
      .select("id")
      .single();

    if (insertError || !newProfile) {
      return {
        success: false,
        error: `Failed to save brand profile: ${insertError?.message}`,
        tokensUsed: result.tokensUsed,
      };
    }

    profileId = newProfile.id;
  }

  // Update brand status to indicate profile is ready
  await supabase
    .from("brands")
    .update({ status: "ready" })
    .eq("id", brandId);

  // Log AI usage
  // Extract just the model name (without provider prefix) for logging
  const modelName = fullModelId.includes(':') ? fullModelId.split(':')[1] : fullModelId;
  await supabase.from("ai_usage_log").insert({
    user_id: user.id,
    team_id: brand.team_id,
    brand_id: brandId,
    provider: modelInfo.provider,
    model: modelName,
    feature: "brand_analysis",
    input_tokens: result.tokensUsed?.input || 0,
    output_tokens: result.tokensUsed?.output || 0,
    total_tokens: result.tokensUsed?.total || 0,
    estimated_cost: estimateCost(modelInfo.provider, modelName, result.tokensUsed?.input || 0, result.tokensUsed?.output || 0),
  });

  // Revalidate paths
  revalidatePath(`/brands/${brandId}`);
  revalidatePath(`/brands/${brandId}/profile`);
  revalidatePath("/brands");

  return {
    success: true,
    profile: {
      id: profileId,
      voiceDescription: result.analysis?.voiceDescription || null,
      toneFormality: result.analysis?.toneFormality || null,
      toneEnthusiasm: result.analysis?.toneEnthusiasm || null,
      toneHumor: result.analysis?.toneHumor || null,
      toneConfidence: result.analysis?.toneConfidence || null,
      toneEmpathy: result.analysis?.toneEmpathy || null,
      confidenceScore: result.analysis?.confidenceScore || null,
      sourcePagesCount: pages.length,
    },
    analysis: result.analysis,
    tokensUsed: result.tokensUsed,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Check if brand has enough content for analysis
 */
export async function canAnalyzeBrand(brandId: string): Promise<{
  canAnalyze: boolean;
  pagesCount: number;
  hasExistingProfile: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  // Count crawled pages
  const { count: pagesCount, error: countError } = await supabase
    .from("crawled_pages")
    .select("*", { count: "exact", head: true })
    .eq("brand_id", brandId)
    .eq("is_active", true)
    .not("markdown_content", "is", null);

  if (countError) {
    return {
      canAnalyze: false,
      pagesCount: 0,
      hasExistingProfile: false,
      error: countError.message,
    };
  }

  // Check for existing profile
  const { data: existingProfile } = await supabase
    .from("brand_profiles")
    .select("id")
    .eq("brand_id", brandId)
    .eq("is_active", true)
    .single();

  return {
    canAnalyze: (pagesCount || 0) >= 1,
    pagesCount: pagesCount || 0,
    hasExistingProfile: !!existingProfile,
  };
}

/**
 * Estimate cost for AI usage
 */
function estimateCost(provider: string, model: string, inputTokens: number, outputTokens: number): number {
  // Cost per 1M tokens (approximate)
  const costs: Record<string, { input: number; output: number }> = {
    "gpt-4o": { input: 2.5, output: 10 },
    "gpt-4o-mini": { input: 0.15, output: 0.6 },
    "claude-sonnet-4-20250514": { input: 3, output: 15 },
    "claude-opus-4-5-20251101": { input: 15, output: 75 },
    "gemini-1.5-pro": { input: 1.25, output: 5 },
  };

  const modelCost = costs[model] || { input: 2, output: 8 };

  return (
    (inputTokens / 1_000_000) * modelCost.input +
    (outputTokens / 1_000_000) * modelCost.output
  );
}
