import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAIService, getDefaultModel } from "@/lib/ai";
import { loadBrandContext } from "@/lib/ai/brand-context";
import { buildContentGenerationPrompt, type ContentGenerationInput } from "@/lib/ai/prompts";
import { getDecryptedAPIKeys } from "@/lib/actions/api-keys";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile for team context
    const { data: profile } = await supabase
      .from("profiles")
      .select("default_team_id")
      .eq("id", user.id)
      .single();

    if (!profile?.default_team_id) {
      return NextResponse.json({ error: "No team found" }, { status: 400 });
    }

    const teamId = profile.default_team_id;

    // Parse request body
    const body = await request.json();
    const {
      brandId,
      inputType,
      content,
      topic,
      targetAudience,
      articleLength,
      cta,
      seoKeywords,
      model: requestedModel,
    } = body as ContentGenerationInput & { brandId: string; model?: string };

    // Validate required fields
    if (!brandId || !inputType || !topic || !targetAudience) {
      return NextResponse.json(
        { error: "Missing required fields: brandId, inputType, topic, targetAudience" },
        { status: 400 }
      );
    }

    // Load brand context
    const { data: brandContext, error: brandError } = await loadBrandContext(brandId);
    if (brandError || !brandContext) {
      return NextResponse.json(
        { error: brandError || "Brand not found" },
        { status: 404 }
      );
    }

    // Get API keys for the team
    const { data: apiKeys, error: keysError } = await getDecryptedAPIKeys(teamId);
    if (keysError || !apiKeys || (!apiKeys.openai && !apiKeys.anthropic && !apiKeys.google)) {
      return NextResponse.json(
        { error: "No AI provider configured. Please add an API key in Settings." },
        { status: 400 }
      );
    }

    // Determine which model to use
    const defaultModel = getDefaultModel(apiKeys);
    const modelToUse = requestedModel || defaultModel;

    if (!modelToUse) {
      return NextResponse.json(
        { error: "No AI model available" },
        { status: 400 }
      );
    }

    // Build the prompt
    const generationInput: ContentGenerationInput = {
      inputType,
      content: content || "",
      topic,
      targetAudience,
      articleLength: articleLength || "medium",
      cta,
      seoKeywords,
    };

    const seoData = seoKeywords?.length
      ? {
          primaryKeywords: seoKeywords.slice(0, 3).map((k) => ({ keyword: k })),
          secondaryKeywords: seoKeywords.slice(3, 6).map((k) => ({ keyword: k })),
        }
      : undefined;

    const { system, user: userPrompt } = buildContentGenerationPrompt(
      generationInput,
      brandContext.profile,
      seoData
    );

    // Create AI service and generate
    const aiService = createAIService(apiKeys, modelToUse);

    // Use streaming for better UX
    const stream = aiService.getTextStream({
      prompt: userPrompt,
      systemPrompt: system,
      model: modelToUse,
      maxTokens: getMaxTokensForLength(articleLength || "medium"),
      temperature: 0.7,
    });

    // Return streaming response
    return stream.toTextStreamResponse();
  } catch (error) {
    console.error("Content generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}

function getMaxTokensForLength(length: "short" | "medium" | "long" | number): number {
  if (typeof length === "number") {
    // Rough estimate: 1.3 tokens per word
    return Math.ceil(length * 1.3);
  }
  return {
    short: 2000,
    medium: 4000,
    long: 8000,
  }[length];
}
