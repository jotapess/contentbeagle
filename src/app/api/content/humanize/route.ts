/**
 * Content Humanization API Route
 *
 * Streaming endpoint for AI-powered content humanization.
 * Removes AI-generated patterns and makes content more natural.
 */

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAIService, getDefaultModel, type PatternMatch } from "@/lib/ai";
import { getDecryptedAPIKeys } from "@/lib/actions/api-keys";
import { loadBrandContext } from "@/lib/ai/brand-context";
import { buildHumanizationPrompt } from "@/lib/ai/prompts/humanization";

export const runtime = "nodejs";
export const maxDuration = 60;

interface HumanizeRequest {
  articleId: string;
  brandId: string;
  content: string;
  matches: PatternMatch[];
  model?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request
    const body: HumanizeRequest = await request.json();
    const { articleId, brandId, content, matches, model } = body;

    if (!articleId || !brandId || !content) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: articleId, brandId, content",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get user's team
    const { data: profile } = await supabase
      .from("profiles")
      .select("default_team_id")
      .eq("id", user.id)
      .single();

    if (!profile?.default_team_id) {
      return new Response(JSON.stringify({ error: "No team found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get API keys
    const { data: apiKeys, error: keysError } = await getDecryptedAPIKeys(
      profile.default_team_id
    );
    if (keysError || !apiKeys) {
      return new Response(
        JSON.stringify({ error: keysError || "Failed to retrieve API keys" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!apiKeys.openai && !apiKeys.anthropic && !apiKeys.google) {
      return new Response(
        JSON.stringify({
          error: "No AI API keys configured. Please add an API key in Settings.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Load brand context for voice matching
    const brandContext = await loadBrandContext(brandId);

    // Build humanization prompts
    const { systemPrompt, userPrompt } = buildHumanizationPrompt({
      content,
      matches: matches || [],
      brandVoice: brandContext?.brandVoice,
      brandName: brandContext?.brandName,
      preserveStructure: true,
    });

    // Get model
    const selectedModel = model || getDefaultModel(apiKeys);
    if (!selectedModel) {
      return new Response(
        JSON.stringify({ error: "No compatible AI model available" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create AI service and stream
    const aiService = createAIService(apiKeys, selectedModel);
    const result = aiService.getTextStream({
      systemPrompt,
      prompt: userPrompt,
      model: selectedModel,
      maxTokens: 4000,
      temperature: 0.7,
    });

    // Return streaming response
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Humanization error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
