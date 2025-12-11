import type { AppError, ErrorCode } from "./types";

const ERROR_MESSAGES: Record<ErrorCode, { message: string; userMessage: string }> = {
  NETWORK_ERROR: {
    message: "Network request failed",
    userMessage: "Unable to connect. Please check your internet connection and try again.",
  },
  API_ERROR: {
    message: "API request failed",
    userMessage: "Something went wrong with the request. Please try again.",
  },
  RATE_LIMIT: {
    message: "Rate limit exceeded",
    userMessage: "Too many requests. Please wait a moment and try again.",
  },
  INVALID_API_KEY: {
    message: "Invalid API key",
    userMessage: "Your API key is invalid or expired. Please check your settings.",
  },
  QUOTA_EXCEEDED: {
    message: "Quota exceeded",
    userMessage: "You've reached your usage limit. Please upgrade your plan or wait for the reset.",
  },
  TIMEOUT: {
    message: "Request timed out",
    userMessage: "The request took too long. Please try again.",
  },
  DATABASE_ERROR: {
    message: "Database operation failed",
    userMessage: "Unable to save your changes. Please try again.",
  },
  VALIDATION_ERROR: {
    message: "Validation failed",
    userMessage: "Please check your input and try again.",
  },
  NOT_FOUND: {
    message: "Resource not found",
    userMessage: "The requested item could not be found.",
  },
  UNAUTHORIZED: {
    message: "Unauthorized",
    userMessage: "Please sign in to continue.",
  },
  FORBIDDEN: {
    message: "Forbidden",
    userMessage: "You don't have permission to perform this action.",
  },
  UNKNOWN_ERROR: {
    message: "Unknown error occurred",
    userMessage: "Something went wrong. Please try again later.",
  },
};

const RETRYABLE_ERRORS: ErrorCode[] = [
  "NETWORK_ERROR",
  "RATE_LIMIT",
  "TIMEOUT",
  "DATABASE_ERROR",
];

export function createAppError(
  code: ErrorCode,
  customMessage?: string,
  details?: Record<string, unknown>,
  statusCode?: number
): AppError {
  const errorInfo = ERROR_MESSAGES[code];
  return {
    code,
    message: customMessage || errorInfo.message,
    userMessage: errorInfo.userMessage,
    details,
    retryable: RETRYABLE_ERRORS.includes(code),
    statusCode,
  };
}

export function parseHttpError(status: number, body?: unknown): AppError {
  const details = typeof body === "object" ? (body as Record<string, unknown>) : undefined;

  switch (status) {
    case 400:
      return createAppError("VALIDATION_ERROR", "Bad request", details, status);
    case 401:
      return createAppError("UNAUTHORIZED", "Authentication required", details, status);
    case 403:
      return createAppError("FORBIDDEN", "Access denied", details, status);
    case 404:
      return createAppError("NOT_FOUND", "Resource not found", details, status);
    case 429:
      return createAppError("RATE_LIMIT", "Rate limit exceeded", details, status);
    case 500:
    case 502:
    case 503:
    case 504:
      return createAppError("API_ERROR", `Server error (${status})`, details, status);
    default:
      return createAppError("API_ERROR", `HTTP error ${status}`, details, status);
  }
}

export function parseError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof TypeError && error.message.includes("fetch")) {
    return createAppError("NETWORK_ERROR", error.message);
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return createAppError("TIMEOUT", "Request was aborted");
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("network") || message.includes("failed to fetch")) {
      return createAppError("NETWORK_ERROR", error.message);
    }

    if (message.includes("timeout")) {
      return createAppError("TIMEOUT", error.message);
    }

    if (message.includes("rate limit") || message.includes("too many requests")) {
      return createAppError("RATE_LIMIT", error.message);
    }

    if (message.includes("api key") || message.includes("invalid key") || message.includes("authentication")) {
      return createAppError("INVALID_API_KEY", error.message);
    }

    if (message.includes("quota") || message.includes("limit exceeded")) {
      return createAppError("QUOTA_EXCEEDED", error.message);
    }

    return createAppError("UNKNOWN_ERROR", error.message);
  }

  return createAppError("UNKNOWN_ERROR", String(error));
}

export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    "userMessage" in error &&
    "retryable" in error
  );
}

export function logError(error: AppError, context?: string): void {
  const logData = {
    timestamp: new Date().toISOString(),
    context,
    code: error.code,
    message: error.message,
    details: error.details,
    statusCode: error.statusCode,
  };

  // In development, log to console
  if (process.env.NODE_ENV === "development") {
    console.error("[Error]", logData);
  }

  // TODO: In production, send to error tracking service (Sentry, etc.)
}
