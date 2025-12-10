"use client";

import { useState, useCallback, useRef } from "react";

export interface GenerationOptions {
  brandId: string;
  inputType: "bullets" | "draft" | "research" | "topic_only";
  content?: string;
  topic: string;
  targetAudience: string;
  articleLength?: "short" | "medium" | "long" | number;
  cta?: string;
  seoKeywords?: string[];
  model?: string;
}

export interface UseAIGenerationReturn {
  generate: (options: GenerationOptions) => Promise<string>;
  isGenerating: boolean;
  generatedContent: string;
  error: string | null;
  abort: () => void;
}

export function useAIGeneration(): UseAIGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  }, []);

  const generate = useCallback(async (options: GenerationOptions): Promise<string> => {
    // Abort any existing generation
    abort();

    setIsGenerating(true);
    setError(null);
    setGeneratedContent("");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/content/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(options),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Generation failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        setGeneratedContent(fullContent);
      }

      setIsGenerating(false);
      abortControllerRef.current = null;
      return fullContent;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setError("Generation cancelled");
      } else {
        setError(err instanceof Error ? err.message : "Generation failed");
      }
      setIsGenerating(false);
      abortControllerRef.current = null;
      throw err;
    }
  }, [abort]);

  return {
    generate,
    isGenerating,
    generatedContent,
    error,
    abort,
  };
}
