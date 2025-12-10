import { experimental_createProviderRegistry as createProviderRegistry } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export interface UserAPIKeys {
  openai?: string;
  anthropic?: string;
  google?: string;
}

export type ProviderName = "openai" | "anthropic" | "google";

export interface ModelInfo {
  id: string;
  name: string;
  provider: ProviderName;
  maxTokens: number;
  inputCostPer1k: number;
  outputCostPer1k: number;
  bestFor: string;
}

export const SUPPORTED_MODELS: ModelInfo[] = [
  {
    id: "openai:gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    maxTokens: 128000,
    inputCostPer1k: 0.005,
    outputCostPer1k: 0.015,
    bestFor: "Long-form content, creative writing",
  },
  {
    id: "openai:gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    maxTokens: 128000,
    inputCostPer1k: 0.00015,
    outputCostPer1k: 0.0006,
    bestFor: "Simple rewrites, quick edits",
  },
  {
    id: "anthropic:claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    provider: "anthropic",
    maxTokens: 200000,
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.015,
    bestFor: "Analysis, brand voice matching",
  },
  {
    id: "anthropic:claude-opus-4-5-20251101",
    name: "Claude Opus 4.5",
    provider: "anthropic",
    maxTokens: 200000,
    inputCostPer1k: 0.015,
    outputCostPer1k: 0.075,
    bestFor: "Complex reasoning, nuanced content",
  },
  {
    id: "google:gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "google",
    maxTokens: 1000000,
    inputCostPer1k: 0.00125,
    outputCostPer1k: 0.005,
    bestFor: "Very long context, document analysis",
  },
];

export function createUserProviderRegistry(keys: UserAPIKeys) {
  const providers: Record<string, ReturnType<typeof createOpenAI | typeof createAnthropic | typeof createGoogleGenerativeAI>> = {};

  if (keys.openai) {
    providers.openai = createOpenAI({ apiKey: keys.openai });
  }
  if (keys.anthropic) {
    providers.anthropic = createAnthropic({ apiKey: keys.anthropic });
  }
  if (keys.google) {
    providers.google = createGoogleGenerativeAI({ apiKey: keys.google });
  }

  return createProviderRegistry(providers);
}

export function getAvailableModels(keys: UserAPIKeys): ModelInfo[] {
  return SUPPORTED_MODELS.filter((model) => {
    if (model.provider === "openai" && keys.openai) return true;
    if (model.provider === "anthropic" && keys.anthropic) return true;
    if (model.provider === "google" && keys.google) return true;
    return false;
  });
}

export function getDefaultModel(keys: UserAPIKeys): string | null {
  // Priority: OpenAI GPT-4o > Anthropic Sonnet > Google Gemini
  if (keys.openai) return "openai:gpt-4o";
  if (keys.anthropic) return "anthropic:claude-sonnet-4-20250514";
  if (keys.google) return "google:gemini-1.5-pro";
  return null;
}
