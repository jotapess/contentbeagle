import { describe, it, expect } from "vitest";
import {
  createAppError,
  parseHttpError,
  parseError,
  isAppError,
} from "./error-handler";

describe("error-handler", () => {
  describe("createAppError", () => {
    it("creates an error with correct properties", () => {
      const error = createAppError("API_ERROR", "Custom message");

      expect(error.code).toBe("API_ERROR");
      expect(error.message).toBe("Custom message");
      expect(error.userMessage).toBe("Something went wrong with the request. Please try again.");
      expect(error.retryable).toBe(false);
    });

    it("marks network errors as retryable", () => {
      const error = createAppError("NETWORK_ERROR");
      expect(error.retryable).toBe(true);
    });

    it("marks rate limit errors as retryable", () => {
      const error = createAppError("RATE_LIMIT");
      expect(error.retryable).toBe(true);
    });

    it("includes details when provided", () => {
      const error = createAppError("API_ERROR", "Error", { endpoint: "/api/test" });
      expect(error.details).toEqual({ endpoint: "/api/test" });
    });
  });

  describe("parseHttpError", () => {
    it("returns validation error for 400 status", () => {
      const error = parseHttpError(400);
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.statusCode).toBe(400);
    });

    it("returns unauthorized error for 401 status", () => {
      const error = parseHttpError(401);
      expect(error.code).toBe("UNAUTHORIZED");
    });

    it("returns forbidden error for 403 status", () => {
      const error = parseHttpError(403);
      expect(error.code).toBe("FORBIDDEN");
    });

    it("returns not found error for 404 status", () => {
      const error = parseHttpError(404);
      expect(error.code).toBe("NOT_FOUND");
    });

    it("returns rate limit error for 429 status", () => {
      const error = parseHttpError(429);
      expect(error.code).toBe("RATE_LIMIT");
      expect(error.retryable).toBe(true);
    });

    it("returns API error for 5xx status codes", () => {
      const error500 = parseHttpError(500);
      expect(error500.code).toBe("API_ERROR");

      const error502 = parseHttpError(502);
      expect(error502.code).toBe("API_ERROR");

      const error503 = parseHttpError(503);
      expect(error503.code).toBe("API_ERROR");
    });
  });

  describe("parseError", () => {
    it("returns AppError if already an AppError", () => {
      const appError = createAppError("API_ERROR");
      const result = parseError(appError);
      expect(result).toBe(appError);
    });

    it("parses network errors from TypeError", () => {
      const error = new TypeError("Failed to fetch");
      const result = parseError(error);
      expect(result.code).toBe("NETWORK_ERROR");
    });

    it("parses timeout errors", () => {
      const error = new Error("Request timeout exceeded");
      const result = parseError(error);
      expect(result.code).toBe("TIMEOUT");
    });

    it("parses rate limit errors from message", () => {
      const error = new Error("Too many requests");
      const result = parseError(error);
      expect(result.code).toBe("RATE_LIMIT");
    });

    it("parses API key errors", () => {
      const error = new Error("Invalid API key");
      const result = parseError(error);
      expect(result.code).toBe("INVALID_API_KEY");
    });

    it("returns unknown error for unrecognized errors", () => {
      const error = new Error("Something unexpected");
      const result = parseError(error);
      expect(result.code).toBe("UNKNOWN_ERROR");
    });

    it("handles non-Error values", () => {
      const result = parseError("string error");
      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe("string error");
    });
  });

  describe("isAppError", () => {
    it("returns true for valid AppError", () => {
      const error = createAppError("API_ERROR");
      expect(isAppError(error)).toBe(true);
    });

    it("returns false for regular Error", () => {
      const error = new Error("test");
      expect(isAppError(error)).toBe(false);
    });

    it("returns false for null", () => {
      expect(isAppError(null)).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(isAppError(undefined)).toBe(false);
    });

    it("returns false for plain object", () => {
      expect(isAppError({ code: "API_ERROR" })).toBe(false);
    });
  });
});
