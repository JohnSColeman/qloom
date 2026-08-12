import { test, expect } from "@playwright/test";

// Source: integration/app1/CoreBehaviorsTests.java (PageLink context demos)
test.describe("PageLink", () => {
  // tapestry: CoreBehaviorsTests — PageLink renders a real, routable href
  test("renders a routable href including its context", async ({ page }) => {
    await page.goto("/pagelink-source");
    await expect(page.locator("#with-context")).toHaveAttribute("href", /\/pagelink-target\/hello$/);
  });

  // tapestry: CoreBehaviorsTests#page_link_with_explicit_activation_context (literal context)
  test("navigates with an explicit activation context", async ({ page }) => {
    await page.goto("/pagelink-source");
    await page.locator("#with-context").click();
    await expect(page).toHaveURL(/\/pagelink-target\/hello$/);
    await expect(page.locator("#result")).toHaveText("hello");
  });

  // tapestry: CoreBehaviorsTests#page_link_with_explicit_empty_context (no context)
  test("navigates with no activation context", async ({ page }) => {
    await page.goto("/pagelink-source");
    await page.locator("#no-context").click();
    await expect(page).toHaveURL(/\/pagelink-target$/);
    await expect(page.locator("#result")).toHaveText("No activation context.");
  });

  // A context-free link renders a bare route href — no trailing/empty segment.
  test("renders a bare href when there is no context", async ({ page }) => {
    await page.goto("/pagelink-source");
    await expect(page.locator("#no-context")).toHaveAttribute("href", /\/pagelink-target$/);
  });

  // Multiple context values become successive path segments (both in the href
  // and after navigation, round-tripping through the target's onActivate).
  test("renders and navigates a multi-value context (two segments)", async ({ page }) => {
    await page.goto("/pagelink-source");
    await expect(page.locator("#multi-context")).toHaveAttribute(
      "href",
      /\/pagelink-target\/a\/b$/,
    );
    await page.locator("#multi-context").click();
    await expect(page).toHaveURL(/\/pagelink-target\/a\/b$/);
    await expect(page.locator("#result")).toHaveText("a/b");
  });

  // Fail-loud: rendering + following PageLinks logs no errors.
  test("PageLink navigation produces no console errors", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/pagelink-source");
    await page.locator("#with-context").click();
    await expect(page).toHaveURL(/\/pagelink-target\/hello$/);
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
