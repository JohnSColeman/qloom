import { test, expect } from "@playwright/test";

// @InjectPage yields the target page instance; returning it from an event
// handler navigates there (the router routes by the instance's constructor).
test.describe("@InjectPage", () => {
  test("returning the injected page navigates to it", async ({ page }) => {
    await page.goto("/injectpage");
    await page.locator("#go").click();
    await expect(page).toHaveURL(/\/injectpage-target$/);
    await expect(page.locator("#target-heading")).toHaveText("Target Page");
  });

  // The navigation is a normal push (not a redirect/replace), so Back returns to
  // the injecting page.
  test("Back returns to the injecting page", async ({ page }) => {
    await page.goto("/injectpage");
    await page.locator("#go").click();
    await expect(page).toHaveURL(/\/injectpage-target$/);

    await page.goBack();
    await expect(page).toHaveURL(/\/injectpage$/);
    await expect(page.locator("#go")).toBeVisible();
  });

  // Fail-loud.
  test("injected-page navigation produces no console errors", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/injectpage");
    await page.locator("#go").click();
    await expect(page.locator("#target-heading")).toHaveText("Target Page");
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
