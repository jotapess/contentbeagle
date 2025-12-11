import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("home page redirects appropriately", async ({ page }) => {
    await page.goto("/");

    // Should redirect to either login or dashboard
    await expect(page).toHaveURL(/login|dashboard/);
  });

  test("login and signup have navigation between them", async ({ page }) => {
    // Start at login
    await page.goto("/login");

    // Click on sign up link
    await page.getByRole("link", { name: /sign up|create account/i }).click();

    // Should navigate to signup
    await expect(page).toHaveURL(/signup/);

    // Click on sign in link
    await page.getByRole("link", { name: /sign in|log in/i }).click();

    // Should navigate back to login
    await expect(page).toHaveURL(/login/);
  });

  test("forgot password is accessible from login", async ({ page }) => {
    await page.goto("/login");

    // Click on forgot password link
    await page.getByRole("link", { name: /forgot|reset/i }).click();

    // Should navigate to forgot password
    await expect(page).toHaveURL(/forgot-password/);
  });
});

test.describe("Accessibility", () => {
  test("login page is keyboard navigable", async ({ page }) => {
    await page.goto("/login");

    // Tab through elements
    await page.keyboard.press("Tab"); // Email
    await expect(page.getByLabel(/email/i)).toBeFocused();

    await page.keyboard.press("Tab"); // Password
    await expect(page.getByLabel(/password/i)).toBeFocused();

    await page.keyboard.press("Tab"); // Sign in button or forgot password
    // Focus should be on an interactive element
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();
  });

  test("forms have accessible labels", async ({ page }) => {
    await page.goto("/login");

    // Email input should have associated label
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toHaveAttribute("type", "email");

    // Password input should have associated label
    const passwordInput = page.getByLabel(/password/i);
    await expect(passwordInput).toHaveAttribute("type", "password");
  });
});
