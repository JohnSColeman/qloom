import { test, expect } from "@playwright/test";

// driveInstance must run cleanupRender even when a render phase throws (try/
// finally). Otherwise a component that sets shared render-state in beginRender
// and restores it in cleanupRender (Form ↔ CurrentForm) would strand it. The
// throw is then caught by the render boundary and reported via ErrorReporter.
test.describe("cleanupRender on throw", () => {
  test("cleanupRender still runs after the body throws", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.addInitScript(() => {
      (window as unknown as { __cleanupRan: boolean }).__cleanupRan = false;
    });

    await page.goto("/cleanup-demo");

    // The body threw and was reported…
    await expect.poll(() => errors.join("\n")).toContain("boom in body");
    // …but cleanupRender still ran (finally).
    expect(
      await page.evaluate(() => (window as unknown as { __cleanupRan: boolean }).__cleanupRan),
    ).toBe(true);
  });

  // The rethrow (after cleanup) reaches the Router render boundary → generic
  // error page, never a half-rendered subtree leaking through.
  test("the rethrow surfaces the generic error page", async ({ page }) => {
    await page.goto("/cleanup-demo");
    const errorBox = page.locator("[data-qloom-error]");
    await expect(errorBox).toBeVisible();
    await expect(errorBox).toContainText("Something went wrong");
  });

  // The error is reported exactly once (WeakSet dedup) even though cleanup runs
  // and the error propagates through finally to the boundary.
  test("the thrown error is reported exactly once", async ({ page }) => {
    const boomLines: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error" && m.text().includes("boom in body")) boomLines.push(m.text());
    });
    await page.goto("/cleanup-demo");
    await expect(page.locator("[data-qloom-error]")).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(boomLines).toHaveLength(1);
  });
});
