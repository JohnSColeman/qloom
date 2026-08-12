import { test, expect } from "@playwright/test";

// Tapestry's page-lifecycle callbacks, adapted to Qloom's poolless, instance-per-
// navigation model. @PageLoaded/@PageAttached fire per navigation (they coincide,
// no page pool); @PageReset fires AFTER onActivate; @PageDetached fires on the
// outgoing page when navigating away (the teardown hook Qloom lacked). Resolvable
// by decorator or convention method name. Pages log into window.__life.
const life = (page: import("@playwright/test").Page) =>
  page.evaluate(() => (window as unknown as { __life?: string[] }).__life ?? []);

test.describe("page lifecycle (@PageLoaded/@PageAttached/@PageDetached/@PageReset)", () => {
  test("loaded + attached fire on a fresh navigation; reset fires AFTER onActivate", async ({ page }) => {
    await page.goto("/life-a");
    await expect(page.locator("#a")).toBeVisible();
    const log = await life(page);
    expect(log).toContain("A:loaded");
    expect(log).toContain("A:attached");
    // loaded → attached → activate → reset (reset is after the activate event)
    expect(log.indexOf("A:loaded")).toBeLessThan(log.indexOf("A:attached"));
    expect(log.indexOf("A:attached")).toBeLessThan(log.indexOf("A:activate"));
    expect(log.indexOf("A:activate")).toBeLessThan(log.indexOf("A:reset"));
    expect(log).not.toContain("A:detached"); // not detached while still current
  });

  test("detached fires on the outgoing page when navigating away", async ({ page }) => {
    await page.goto("/life-a");
    await page.locator("#to-b").click();
    await expect(page.locator("#b")).toBeVisible();
    const log = await life(page);
    expect(log).toContain("A:detached");
    // the outgoing page is torn down before the incoming page resets/renders is n/a
    // (B has no reset); assert A detaches after B attaches (Qloom builds the new
    // page, then replaces the old) and exactly once
    expect(log.indexOf("B:attached")).toBeLessThan(log.indexOf("A:detached"));
    expect(log.filter((e) => e === "A:detached")).toHaveLength(1);
  });

  test("convention method names work without decorators", async ({ page }) => {
    await page.goto("/life-conv");
    await expect(page.locator("#conv")).toBeVisible();
    const log = await life(page);
    expect(log).toEqual(["conv:loaded", "conv:attached", "conv:reset"]);
  });

  test("a page that redirects in onActivate attaches but does NOT reset", async ({ page }) => {
    await page.goto("/life-redirect");
    await expect(page.locator("#b")).toBeVisible(); // redirected to life-b
    const log = await life(page);
    expect(log).toContain("R:attached");
    expect(log).not.toContain("R:reset");
  });

  test("teardown: a timer started in pageAttached is cleared by pageDetached", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto("/life-timer");
    // timer running → ticks climb
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __timerTicks?: number }).__timerTicks ?? 0), { timeout: 3000 })
      .toBeGreaterThan(1);
    await page.locator("#away").click(); // navigate away → pageDetached clears the timer
    await expect(page.locator("#b")).toBeVisible();
    await page.waitForTimeout(200);
    const a = await page.evaluate(() => (window as unknown as { __timerTicks?: number }).__timerTicks ?? 0);
    await page.waitForTimeout(400); // several intervals pass
    const b = await page.evaluate(() => (window as unknown as { __timerTicks?: number }).__timerTicks ?? 0);
    expect(b).toBe(a); // timer stopped
    expect(errors).toEqual([]);
  });
});
