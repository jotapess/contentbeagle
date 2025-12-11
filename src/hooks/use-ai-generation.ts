/**
 * useAIGeneration Hook
 *
 * Frontend hook for streaming AI content generation with abort support.
 */

'use client';

import { useState, useCallback, useRef } from 'react';

export type InputType = 'bullets' | 'draft' | 'research' | 'topic_only';
export type ArticleLength = 'short' | 'medium' | 'long';

export interface GenerationInput {
  brandId: string;
  inputType: InputType;
  content: string;
  topic?: string;
  targetAudience?: string;
  articleLength: ArticleLength;
  cta?: string;
  seoKeywords?: string[];
  model?: string;
}

export interface UseAIGenerationReturn {
  generatedContent: string;
  isGenerating: boolean;
  error: string | null;
  generate: (input: GenerationInput) => Promise<string>;
  abort: () => void;
  reset: () => void;
}

export function useAIGeneration(): UseAIGenerationReturn {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setContent('');
    setError(null);
    setIsGenerating(false);
  }, []);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  }, []);

  const generate = useCallback(async (input: GenerationInput): Promise<string> => {
    // Reset state
    setContent('');
    setError(null);
    setIsGenerating(true);

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
        signal: abortControllerRef.current.signal,
        credentials: 'include', // Ensure cookies are sent for auth
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Generation failed' }));
        throw new Error(errorData.error || 'Generation failed');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        setContent(fullContent);
      }

      setIsGenerating(false);
      return fullContent;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Generation cancelled');
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Generation failed';
        setError(errorMessage);
      }
      setIsGenerating(false);
      throw err;
    }
  }, []);

  return {
    generatedContent: content,
    isGenerating,
    error,
    generate,
    abort,
    reset,
  };
}
