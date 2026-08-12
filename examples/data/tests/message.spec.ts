import { test, expect } from "@playwright/test";

/** `${message:key}` resolves a configured key; unknown keys fall back to the key. */
test.describe("message: expansion (i18n)", () => {
  test("resolves a configured key and falls back to the key name", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#tagline")).toHaveText("Find your perfect stay");
    await expect(page.locator("#missing")).toHaveText("no-such-key");
  });
});
