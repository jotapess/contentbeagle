import * as React from "react";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * Custom render function that wraps components with necessary providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  // Add any custom options here
}

function AllProviders({ children }: { children: React.ReactNode }) {
  // Add providers here as needed (e.g., AuthProvider, ThemeProvider)
  return <>{children}</>;
}

function customRender(
  ui: React.ReactElement,
  options?: CustomRenderOptions
): RenderResult {
  return render(ui, { wrapper: AllProviders, ...options });
}

/**
 * Create a user event instance for interaction testing
 */
function setupUser() {
  return userEvent.setup();
}

// Re-export everything from testing library
export * from "@testing-library/react";

// Override render with custom render
export { customRender as render, setupUser };

/**
 * Wait for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout = 5000
): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error("Timeout waiting for condition");
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

/**
 * Create a mock function that resolves after a delay
 */
export function createMockAsync<T>(value: T, delay = 100) {
  return async (): Promise<T> => {
    await new Promise((resolve) => setTimeout(resolve, delay));
    return value;
  };
}

/**
 * Create a mock error response
 */
export function createMockError(message = "Test error") {
  return { error: new Error(message), data: null };
}

/**
 * Create a mock success response
 */
export function createMockSuccess<T>(data: T) {
  return { error: null, data };
}
