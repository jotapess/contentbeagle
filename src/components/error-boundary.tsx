"use client";

import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onReset?: () => void;
  title?: string;
  description?: string;
}

export function ErrorFallback({
  error,
  onReset,
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again.",
}: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="size-6 text-destructive" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {error && process.env.NODE_ENV === "development" && (
          <CardContent>
            <div className="rounded-md bg-muted p-3 text-xs">
              <p className="font-mono text-destructive">{error.message}</p>
            </div>
          </CardContent>
        )}
        <CardFooter className="flex justify-center gap-2">
          {onReset && (
            <Button onClick={onReset} variant="outline">
              <RefreshCw className="mr-2 size-4" />
              Try again
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => window.location.reload()}
          >
            Refresh page
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

interface AsyncErrorBoundaryProps extends ErrorBoundaryProps {
  suspenseFallback?: React.ReactNode;
}

export function AsyncErrorBoundary({
  children,
  suspenseFallback,
  ...props
}: AsyncErrorBoundaryProps) {
  return (
    <ErrorBoundary {...props}>
      <React.Suspense
        fallback={
          suspenseFallback || (
            <div className="flex min-h-[200px] items-center justify-center">
              <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
            </div>
          )
        }
      >
        {children}
      </React.Suspense>
    </ErrorBoundary>
  );
}

// Hook for handling errors in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: unknown) => {
    if (error instanceof Error) {
      setError(error);
    } else {
      setError(new Error(String(error)));
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  // Throw the error to be caught by the nearest ErrorBoundary
  if (error) {
    throw error;
  }

  return { handleError, clearError };
}
