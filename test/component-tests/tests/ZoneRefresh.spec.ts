import { test, expect } from "@playwright/test";

// Ported from Tapestry ZoneRefresh. The mixin refreshes its host Zone on a timer
// (firing a `refresh` event so the page updates state, then re-rendering the zone
// locally). The interesting part in Qloom is lifecycle: the timer self-clears
// when the zone's element detaches, so nothing leaks across navigation.
test.describe("ZoneRefresh mixin (@InjectContainer + self-tearing-down timer)", () => {
  test("periodically refreshes the zone, updating the page state each tick", async ({ page }) => {
    await page.goto("/zone-refresh");
    await expect(page.locator("#tick")).toHaveText("0");
    // period 0.2s → several ticks accumulate within a few seconds, and the zone
    // re-renders in place to show the new value (proving the local refresh path).
    await expect
      .poll(async () => Number(await page.locator("#tick").textContent()), { timeout: 4000 })
      .toBeGreaterThan(2);
  });

  test("the timer stops once the zone is navigated away from (no leak)", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.goto("/zone-refresh");
    // confirm the timer is actually running
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __zrTicks?: number }).__zrTicks ?? 0), {
        timeout: 4000,
      })
      .toBeGreaterThan(1);
    // client-side navigate away (window survives, so we can watch the counter)
    await page.locator("#leave").click();
    await expect(page).toHaveURL(/\/environmental$/);
    await page.waitForTimeout(300);
    const a = await page.evaluate(() => (window as unknown as { __zrTicks?: number }).__zrTicks ?? 0);
    await page.waitForTimeout(700); // several timer periods pass
    const b = await page.evaluate(() => (window as unknown as { __zrTicks?: number }).__zrTicks ?? 0);
    expect(b).toBe(a); // the timer self-cleared when the zone detached
    expect(errors).toEqual([]);
  });
});
