import { test, expect } from "@playwright/test";

// Source: integration/app1/AjaxTests.java#progressive_display — ProgressiveDisplay.
test.describe("ProgressiveDisplay", () => {
  // tapestry: progressive_display — the true body is supplied after the initial render
  test("reveals the real content after the deferred update", async ({ page }) => {
    await page.goto("/progressivedisplay");
    await expect(page.locator("#real")).toHaveText("Real content");
    // The deferred body must REPLACE the "loading …" placeholder, not sit beside
    // it — a regression that made the component render synchronously (never
    // showing/clearing the placeholder) or that appended would be caught here.
    await expect(page.getByText("loading")).toHaveCount(0);
  });

  // edge: the revealed body is patched INTO the component's own <div> (Zones.patch
  // targets the placeholder container), so #real is a descendant of that wrapper.
  test("the revealed content replaces the placeholder in-place", async ({ page }) => {
    await page.goto("/progressivedisplay");
    // #real is patched directly into the component's wrapper <div>.
    await expect(page.locator("div > #real")).toHaveText("Real content");
  });

  // chaos: the deferred reveal (setTimeout + Zones.patch) must not raise a
  // console/page error.
  test("the deferred reveal is error-free", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/progressivedisplay");
    await expect(page.locator("#real")).toHaveText("Real content");
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
