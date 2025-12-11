import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("redirects to login when not authenticated", async ({ page }) => {
    // Try to access the dashboard
    await page.goto("/dashboard");

    // Should be redirected to login
    await expect(page).toHaveURL(/login/);
  });

  test("login page has required elements", async ({ page }) => {
    await page.goto("/login");

    // Check for email input
    await expect(page.getByLabel(/email/i)).toBeVisible();

    // Check for password input
    await expect(page.getByLabel(/password/i)).toBeVisible();

    // Check for sign in button
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();

    // Check for link to signup
    await expect(page.getByRole("link", { name: /sign up/i })).toBeVisible();
  });

  test("signup page has required elements", async ({ page }) => {
    await page.goto("/signup");

    // Check for name input
    await expect(page.getByLabel(/name/i)).toBeVisible();

    // Check for email input
    await expect(page.getByLabel(/email/i)).toBeVisible();

    // Check for password input
    await expect(page.getByLabel(/password/i)).toBeVisible();

    // Check for create account button
    await expect(
      page.getByRole("button", { name: /create account|sign up/i })
    ).toBeVisible();
  });

  test("forgot password page has required elements", async ({ page }) => {
    await page.goto("/forgot-password");

    // Check for email input
    await expect(page.getByLabel(/email/i)).toBeVisible();

    // Check for reset button
    await expect(
      page.getByRole("button", { name: /reset|send/i })
    ).toBeVisible();
  });

  test("shows validation error for invalid email", async ({ page }) => {
    await page.goto("/login");

    // Fill invalid email
    await page.getByLabel(/email/i).fill("invalid-email");
    await page.getByLabel(/password/i).fill("password123");

    // Click sign in
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should show validation error
    await expect(page.getByText(/valid email|invalid/i)).toBeVisible();
  });
});
