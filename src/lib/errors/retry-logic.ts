import type { RetryConfig, AppError } from "./types";
import { DEFAULT_RETRY_CONFIG } from "./types";
import { parseError, logError } from "./error-handler";

interface RetryResult<T> {
  data?: T;
  error?: AppError;
  attempts: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  // Add jitter to prevent thundering herd
  const jitter = delay * 0.2 * Math.random();
  return Math.min(delay + jitter, config.maxDelay);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  context?: string
): Promise<RetryResult<T>> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: AppError | undefined;
  let attempt = 0;

  while (attempt < retryConfig.maxAttempts) {
    attempt++;

    try {
      const result = await fn();
      return { data: result, attempts: attempt };
    } catch (error) {
      lastError = parseError(error);
      logError(lastError, context);

      // Don't retry if error is not retryable
      if (!lastError.retryable) {
        return { error: lastError, attempts: attempt };
      }

      // Don't wait after last attempt
      if (attempt < retryConfig.maxAttempts) {
        const delay = calculateDelay(attempt, retryConfig);
        await sleep(delay);
      }
    }
  }

  return { error: lastError, attempts: attempt };
}

export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await fn();
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function createRetryableFetch(
  config: Partial<RetryConfig> = {}
): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const result = await withRetry(
      () => fetch(input, init),
      config,
      `fetch:${typeof input === "string" ? input : input.toString()}`
    );

    if (result.error) {
      throw result.error;
    }

    return result.data!;
  };
}
