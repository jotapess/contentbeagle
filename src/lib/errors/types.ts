export type ErrorCode =
  | "NETWORK_ERROR"
  | "API_ERROR"
  | "RATE_LIMIT"
  | "INVALID_API_KEY"
  | "QUOTA_EXCEEDED"
  | "TIMEOUT"
  | "DATABASE_ERROR"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "UNKNOWN_ERROR";

export interface AppError {
  code: ErrorCode;
  message: string;
  userMessage: string;
  details?: Record<string, unknown>;
  retryable: boolean;
  statusCode?: number;
}

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface RateLimitInfo {
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
};
