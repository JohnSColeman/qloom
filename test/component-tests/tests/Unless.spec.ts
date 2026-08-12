import { test, expect } from "@playwright/test";

// Source: integration/app1/GeneralComponentTests.java#unless_component
test.describe("Unless", () => {
  // tapestry: GeneralComponentTests#unless_component
  test("renders body when test is false", async ({ page }) => {
    await page.goto("/if-unless");
    await expect(page.locator("#unless-false")).toHaveText("false is rendered");
  });

  // tapestry: GeneralComponentTests#unless_component
  test("renders nothing when test is true", async ({ page }) => {
    await page.goto("/if-unless");
    await expect(page.locator("#unless-true")).toHaveText("");
  });

  // edge: interpolated body content is HTML-escaped (rendered as literal text)
  test("escapes markup in its rendered body", async ({ page }) => {
    await page.goto("/if-unless");
    await expect(page.locator("#unless-escaped")).toHaveText("<b>&</b>");
    await expect(page.locator("#unless-escaped b")).toHaveCount(0);
  });
});
