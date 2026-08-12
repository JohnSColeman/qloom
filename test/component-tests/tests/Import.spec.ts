import { test, expect } from "@playwright/test";

// Source: @Import ports Tapestry's stylesheet/library asset imports. The engine
// injects <link>/<script> into <head> at render, deduped, resolving context:.
test.describe("@Import", () => {
  test("injects a context: stylesheet that loads and applies", async ({ page }) => {
    await page.goto("/import");
    await expect(page.locator('head link[rel=stylesheet][href="/import-demo.css"]')).toHaveCount(1);
    // Proves the stylesheet actually loaded and applied, not just that a tag exists.
    await expect(page.locator("#import-marker")).toHaveCSS("color", "rgb(1, 2, 3)");
  });

  test("injects and executes a context: library", async ({ page }) => {
    await page.goto("/import");
    await expect(page.locator('head script[src="/import-demo.js"]')).toHaveCount(1);
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __importDemoLoaded?: boolean }).__importDemoLoaded))
      .toBe(true);
  });

  test("passes a known-scheme (data:) URL through unchanged", async ({ page }) => {
    await page.goto("/import");
    await expect(page.locator('head link[href="data:text/css,x"]')).toHaveCount(1);
  });

  test("warns and skips unsupported-scheme assets (classpath:, asset:)", async ({ page }) => {
    const warnings: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "warning") warnings.push(m.text());
    });
    await page.goto("/import");
    await expect(page.locator('head link[href*="nope.css"]')).toHaveCount(0);
    await expect(page.locator('head link[href*="unknown.css"]')).toHaveCount(0);
    expect(warnings.some((w) => /@Import/.test(w) && /nope\.css/.test(w))).toBe(true);
    expect(warnings.some((w) => /@Import/.test(w) && /unknown\.css/.test(w))).toBe(true);
  });

  test("dedups assets that resolve to the same URL", async ({ page }) => {
    await page.goto("/import");
    // context:/import-demo.css and /import-demo.css both resolve to /import-demo.css
    await expect(page.locator('head link[href="/import-demo.css"]')).toHaveCount(1);
  });

  // The injected-URL dedup set is process-global and intentionally NOT reset on
  // SPA navigation (Assets: "a shared Layout's assets inject once for the
  // document lifetime"). Re-rendering the page client-side must not append a
  // second <link>. (Uses same-document navigation via popstate — a full reload
  // would reset the JS context and defeat the check.)
  test("re-rendering the page (SPA nav) does not duplicate injected assets", async ({ page }) => {
    await page.goto("/import");
    await expect(page.locator('head link[href="/import-demo.css"]')).toHaveCount(1);

    // Client-side navigate away and back within the same document.
    await page.evaluate(() => {
      history.pushState({}, "", "/zone-prune-target");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    await expect(page.locator("#target")).toBeVisible();

    await page.evaluate(() => {
      history.pushState({}, "", "/import");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    await expect(page.locator("#import-marker")).toBeVisible();

    // Still exactly one — the dedup set survived the re-render.
    await expect(page.locator('head link[href="/import-demo.css"]')).toHaveCount(1);
  });
});
