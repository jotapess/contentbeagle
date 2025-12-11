/**
 * useHumanization Hook
 *
 * Frontend hook for AI pattern detection and content humanization.
 * Includes detection, streaming humanization, and abort support.
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import type { PatternMatch, DetectionResult } from '@/lib/ai';

export interface HumanizationInput {
  articleId: string;
  brandId: string;
  content: string;
  matches: PatternMatch[];
  model?: string;
}

export interface UseHumanizationReturn {
  // Detection
  detectionResult: DetectionResult | null;
  isDetecting: boolean;
  detect: (articleId: string, content?: string) => Promise<DetectionResult | null>;

  // Humanization
  humanizedContent: string;
  isHumanizing: boolean;
  humanize: (input: HumanizationInput) => Promise<string>;

  // Shared
  error: string | null;
  abort: () => void;
  reset: () => void;
}

export function useHumanization(): UseHumanizationReturn {
  // Detection state
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  // Humanization state
  const [humanizedContent, setHumanizedContent] = useState('');
  const [isHumanizing, setIsHumanizing] = useState(false);

  // Shared state
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setDetectionResult(null);
    setHumanizedContent('');
    setError(null);
    setIsDetecting(false);
    setIsHumanizing(false);
  }, []);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsDetecting(false);
    setIsHumanizing(false);
  }, []);

  /**
   * Detect AI patterns in content
   */
  const detect = useCallback(async (
    articleId: string,
    content?: string
  ): Promise<DetectionResult | null> => {
    setError(null);
    setIsDetecting(true);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/content/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ articleId, content }),
        signal: abortControllerRef.current.signal,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Detection failed' }));
        throw new Error(errorData.error || 'Detection failed');
      }

      const result: DetectionResult = await response.json();
      setDetectionResult(result);
      setIsDetecting(false);
      return result;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Detection cancelled');
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Detection failed';
        setError(errorMessage);
      }
      setIsDetecting(false);
      return null;
    }
  }, []);

  /**
   * Humanize content with streaming
   */
  const humanize = useCallback(async (input: HumanizationInput): Promise<string> => {
    setHumanizedContent('');
    setError(null);
    setIsHumanizing(true);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/content/humanize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
        signal: abortControllerRef.current.signal,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Humanization failed' }));
        throw new Error(errorData.error || 'Humanization failed');
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
        setHumanizedContent(fullContent);
      }

      setIsHumanizing(false);
      return fullContent;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Humanization cancelled');
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Humanization failed';
        setError(errorMessage);
      }
      setIsHumanizing(false);
      throw err;
    }
  }, []);

  return {
    // Detection
    detectionResult,
    isDetecting,
    detect,

    // Humanization
    humanizedContent,
    isHumanizing,
    humanize,

    // Shared
    error,
    abort,
    reset,
  };
}
