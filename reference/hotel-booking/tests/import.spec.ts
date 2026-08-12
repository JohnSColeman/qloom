import { test, expect } from "@playwright/test";

/**
 * Layout ports `@Import(stylesheet={"context:/static/style.css"},
 * library={"context:/static/hotel-booking.js"})`. Signin and Search both use
 * Layout, so reaching Search means Layout rendered twice in one document —
 * proving both that the assets load and that injection is deduped.
 */
test("Layout's @Import loads the stylesheet + library once across navigation", async ({ page }) => {
  await page.goto("/"); // → signin (Layout render #1)
  await expect(page).toHaveURL(/\/signin$/);

  await page.locator("input[name=username]").fill("JohnDoe");
  await page.locator("input[name=password]").fill("secret");
  await page.locator("input[type=submit]").click();
  await expect(page).toHaveURL(/\/search$/); // → Layout render #2

  // Both assets present exactly once despite two Layout renders (dedup).
  await expect(page.locator('head link[href="/static/style.css"]')).toHaveCount(1);
  await expect(page.locator('head script[src="/static/hotel-booking.js"]')).toHaveCount(1);

  // The library actually executed.
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __hotelBookingJs?: boolean }).__hotelBookingJs))
    .toBe(true);
});
