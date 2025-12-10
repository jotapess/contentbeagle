import { NextResponse } from "next/server";
import { createAIService, getDefaultModel } from "@/lib/ai";
import type { UserAPIKeys } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const { provider, apiKey } = await request.json();

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: "Provider and API key are required" },
        { status: 400 }
      );
    }

    // Create keys object with only the provided key
    const keys: UserAPIKeys = {};
    if (provider === "openai") keys.openai = apiKey;
    else if (provider === "anthropic") keys.anthropic = apiKey;
    else if (provider === "google") keys.google = apiKey;
    else {
      return NextResponse.json(
        { error: "Invalid provider" },
        { status: 400 }
      );
    }

    const defaultModel = getDefaultModel(keys);
    if (!defaultModel) {
      return NextResponse.json(
        { error: "No valid model available" },
        { status: 400 }
      );
    }

    const aiService = createAIService(keys, defaultModel);

    // Simple test prompt
    const result = await aiService.generate({
      prompt: "Say 'Hello! Connection successful.' in exactly those words.",
      model: defaultModel,
      maxTokens: 50,
      temperature: 0,
    });

    return NextResponse.json({
      success: true,
      model: result.model,
      response: result.content,
      usage: result.usage,
    });
  } catch (error) {
    console.error("AI test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Connection test failed",
      },
      { status: 500 }
    );
  }
}
