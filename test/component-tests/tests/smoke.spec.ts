import { test, expect } from "@playwright/test";

test("harness boots and serves the catalog", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#catalog")).toHaveText("Qloom component-tests");
});
