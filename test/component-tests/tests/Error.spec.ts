import { test, expect } from "@playwright/test";

// Source: integration/app1/FormTests.java — Error (single-field validation).
test.describe("Error", () => {
  // tapestry: Error presents the single field's validation error after submit
  test("presents the field's validation error after an invalid submit", async ({ page }) => {
    await page.goto("/error");
    await page.locator("#submit").click();
    await expect(page.getByText("You must provide a value for Email.")).toBeVisible();
  });

  // edge: nothing is decorated before a submit — the field carries no error class
  // and no popup exists yet.
  test("shows no error before submission", async ({ page }) => {
    await page.goto("/error");
    await expect(page.locator("input[name=email]")).not.toHaveClass(/t-error/);
    await expect(page.locator(".t-error-popup")).toHaveCount(0);
  });

  // functional: correcting the field and resubmitting clears the decoration — the
  // now-valid field is re-marked clean (t-error removed) and its popup hidden.
  test("correcting the field and resubmitting clears the error", async ({ page }) => {
    await page.goto("/error");
    await page.locator("#submit").click();
    await expect(page.locator("input[name=email]")).toHaveClass(/t-error/);
    await page.locator("input[name=email]").fill("someone@example.com");
    await page.locator("#submit").click();
    await expect(page.locator("input[name=email]")).not.toHaveClass(/t-error/);
    await expect(page.locator(".t-error-popup")).toBeHidden();
  });
});
