"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { type AppError, parseError } from "@/lib/errors";

interface UseErrorToastOptions {
  defaultTitle?: string;
}

export function useErrorToast(options: UseErrorToastOptions = {}) {
  const { defaultTitle = "Error" } = options;

  const showError = useCallback(
    (error: unknown, customMessage?: string) => {
      const appError: AppError = parseError(error);

      toast.error(customMessage || defaultTitle, {
        description: appError.userMessage,
        duration: 5000,
        action: appError.retryable
          ? {
              label: "Retry",
              onClick: () => {
                // Toast action - page refresh as fallback
                window.location.reload();
              },
            }
          : undefined,
      });

      return appError;
    },
    [defaultTitle]
  );

  const showApiError = useCallback(
    (error: unknown, context?: string) => {
      const appError = parseError(error);

      const title = context ? `${context} failed` : defaultTitle;

      toast.error(title, {
        description: appError.userMessage,
        duration: 6000,
      });

      return appError;
    },
    [defaultTitle]
  );

  const showRateLimitError = useCallback((service: string, retryAfter?: number) => {
    const message = retryAfter
      ? `Rate limit exceeded for ${service}. Please wait ${retryAfter} seconds.`
      : `Rate limit exceeded for ${service}. Please try again later.`;

    toast.error("Rate Limit", {
      description: message,
      duration: 8000,
    });
  }, []);

  const showNetworkError = useCallback(() => {
    toast.error("Connection Error", {
      description: "Unable to connect. Please check your internet connection.",
      duration: 5000,
      action: {
        label: "Retry",
        onClick: () => window.location.reload(),
      },
    });
  }, []);

  const showValidationError = useCallback((message: string) => {
    toast.error("Validation Error", {
      description: message,
      duration: 4000,
    });
  }, []);

  return {
    showError,
    showApiError,
    showRateLimitError,
    showNetworkError,
    showValidationError,
  };
}
