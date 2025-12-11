import type { RateLimitInfo, AppError } from "./types";
import { createAppError } from "./error-handler";

interface RateLimitState {
  remaining: number;
  resetAt: number;
  lastUpdated: number;
}

// In-memory rate limit tracking per service
const rateLimitStates = new Map<string, RateLimitState>();

export function parseRateLimitHeaders(headers: Headers): RateLimitInfo | null {
  // Standard rate limit headers
  const remaining = headers.get("X-RateLimit-Remaining") ||
                   headers.get("RateLimit-Remaining") ||
                   headers.get("x-ratelimit-remaining");

  const reset = headers.get("X-RateLimit-Reset") ||
               headers.get("RateLimit-Reset") ||
               headers.get("x-ratelimit-reset");

  const retryAfter = headers.get("Retry-After") || headers.get("retry-after");

  if (!remaining && !reset && !retryAfter) {
    return null;
  }

  return {
    remaining: remaining ? parseInt(remaining, 10) : 0,
    resetAt: reset ? new Date(parseInt(reset, 10) * 1000) : new Date(Date.now() + 60000),
    retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined,
  };
}

export function updateRateLimitState(service: string, info: RateLimitInfo): void {
  rateLimitStates.set(service, {
    remaining: info.remaining,
    resetAt: info.resetAt.getTime(),
    lastUpdated: Date.now(),
  });
}

export function checkRateLimit(service: string): { allowed: boolean; waitMs?: number } {
  const state = rateLimitStates.get(service);

  if (!state) {
    return { allowed: true };
  }

  // Check if reset time has passed
  if (Date.now() >= state.resetAt) {
    rateLimitStates.delete(service);
    return { allowed: true };
  }

  // Check if we still have remaining requests
  if (state.remaining > 0) {
    return { allowed: true };
  }

  // Calculate wait time
  const waitMs = state.resetAt - Date.now();
  return { allowed: false, waitMs: Math.max(0, waitMs) };
}

export function decrementRateLimit(service: string): void {
  const state = rateLimitStates.get(service);
  if (state && state.remaining > 0) {
    state.remaining--;
  }
}

export async function withRateLimitHandling<T>(
  service: string,
  fn: () => Promise<Response>,
  parseResponse: (response: Response) => Promise<T>
): Promise<{ data?: T; error?: AppError; rateLimitInfo?: RateLimitInfo }> {
  // Check if we should wait before making request
  const { allowed, waitMs } = checkRateLimit(service);

  if (!allowed && waitMs) {
    // If wait time is short, wait and retry
    if (waitMs < 60000) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    } else {
      return {
        error: createAppError(
          "RATE_LIMIT",
          `Rate limit exceeded for ${service}`,
          { waitMs, resetAt: new Date(Date.now() + waitMs).toISOString() }
        ),
      };
    }
  }

  try {
    decrementRateLimit(service);
    const response = await fn();

    // Parse rate limit headers
    const rateLimitInfo = parseRateLimitHeaders(response.headers);
    if (rateLimitInfo) {
      updateRateLimitState(service, rateLimitInfo);
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      return {
        error: createAppError(
          "RATE_LIMIT",
          `Rate limit exceeded for ${service}`,
          { retryAfter }
        ),
        rateLimitInfo: rateLimitInfo ?? undefined,
      };
    }

    if (!response.ok) {
      const body = await response.text().catch(() => null);
      return {
        error: createAppError(
          "API_ERROR",
          `${service} API error: ${response.status}`,
          { status: response.status, body }
        ),
        rateLimitInfo: rateLimitInfo ?? undefined,
      };
    }

    const data = await parseResponse(response);
    return { data, rateLimitInfo: rateLimitInfo ?? undefined };
  } catch (error) {
    return {
      error: createAppError(
        "NETWORK_ERROR",
        error instanceof Error ? error.message : "Network request failed"
      ),
    };
  }
}

export function getRateLimitStatus(service: string): RateLimitState | null {
  return rateLimitStates.get(service) || null;
}

export function clearRateLimitState(service: string): void {
  rateLimitStates.delete(service);
}
