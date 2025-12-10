import { streamText, generateText } from "ai";
import { createUserProviderRegistry, type UserAPIKeys } from "./provider-registry";

export interface GenerationRequest {
  prompt: string;
  systemPrompt?: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface GenerationResult {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: string;
}

export interface StreamGenerationResult {
  stream: ReadableStream<string>;
  usage: Promise<{
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }>;
}

export class AIGenerationService {
  private registry: ReturnType<typeof createUserProviderRegistry>;
  private defaultModel: string;

  constructor(keys: UserAPIKeys, defaultModel: string) {
    this.registry = createUserProviderRegistry(keys);
    this.defaultModel = defaultModel;
  }

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const modelId = (request.model || this.defaultModel) as `${string}:${string}`;
    const model = this.registry.languageModel(modelId);

    const result = await generateText({
      model,
      prompt: request.prompt,
      system: request.systemPrompt,
      maxOutputTokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.7,
    });

    const usage = result.usage;

    return {
      content: result.text,
      usage: {
        promptTokens: usage?.inputTokens ?? 0,
        completionTokens: usage?.outputTokens ?? 0,
        totalTokens: (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0),
      },
      model: request.model || this.defaultModel,
      finishReason: result.finishReason ?? "unknown",
    };
  }

  async *streamGenerate(request: GenerationRequest): AsyncGenerator<string, GenerationResult> {
    const modelId = (request.model || this.defaultModel) as `${string}:${string}`;
    const model = this.registry.languageModel(modelId);

    const result = streamText({
      model,
      prompt: request.prompt,
      system: request.systemPrompt,
      maxOutputTokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.7,
    });

    let fullContent = "";

    for await (const textPart of result.textStream) {
      fullContent += textPart;
      yield textPart;
    }

    const usage = await result.usage;
    const finishReason = await result.finishReason;

    return {
      content: fullContent,
      usage: {
        promptTokens: usage?.inputTokens ?? 0,
        completionTokens: usage?.outputTokens ?? 0,
        totalTokens: (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0),
      },
      model: request.model || this.defaultModel,
      finishReason: finishReason ?? "unknown",
    };
  }

  getTextStream(request: GenerationRequest) {
    const modelId = (request.model || this.defaultModel) as `${string}:${string}`;
    const model = this.registry.languageModel(modelId);

    return streamText({
      model,
      prompt: request.prompt,
      system: request.systemPrompt,
      maxOutputTokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.7,
    });
  }
}

export function createAIService(keys: UserAPIKeys, defaultModel: string) {
  return new AIGenerationService(keys, defaultModel);
}
