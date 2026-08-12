import { test, expect } from "@playwright/test";

// The Zone registry must not grow across navigations: each page render clears
// the previous page's registrations (their DOM is gone). Otherwise the map —
// holding live elements and render closures — leaks a page's worth of state on
// every navigation.
test.describe("Zone registry pruning", () => {
  test("navigating away drops the previous page's zone registrations", async ({ page }) => {
    await page.goto("/zone-prune");
    // Two zones registered on this page.
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __zoneCount(): number }).__zoneCount()))
      .toBe(2);

    // SPA-navigate to a page with no zones.
    await page.locator("#go").click();
    await expect(page).toHaveURL(/\/zone-prune-target$/);
    await expect(page.locator("#target")).toBeVisible();

    // The two zones from the previous page were pruned — registry is empty.
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __zoneCount(): number }).__zoneCount()))
      .toBe(0);
  });

  // Round-trip: away then Back must re-register exactly the page's zones (2), not
  // accumulate them (4). Zones.clear() on each render is what keeps this stable.
  test("Back re-registers the page's zones without leaking", async ({ page }) => {
    const count = () =>
      page.evaluate(() => (window as unknown as { __zoneCount(): number }).__zoneCount());

    await page.goto("/zone-prune");
    await expect.poll(count).toBe(2);

    await page.locator("#go").click();
    await expect(page).toHaveURL(/\/zone-prune-target$/);
    await expect.poll(count).toBe(0);

    await page.goBack(); // back to zone-prune → its 2 zones re-register, not 4
    await expect(page).toHaveURL(/\/zone-prune$/);
    await expect.poll(count).toBe(2);

    await page.goForward(); // forward to the zero-zone page → pruned again
    await expect(page).toHaveURL(/\/zone-prune-target$/);
    await expect.poll(count).toBe(0);
  });

  // A reload rebuilds the same page from scratch: the count must settle at 2,
  // not double (the fresh JS context clears any prior registry).
  test("a reload leaves the registry at the page's own zone count", async ({ page }) => {
    const count = () =>
      page.evaluate(() => (window as unknown as { __zoneCount(): number }).__zoneCount());

    await page.goto("/zone-prune");
    await expect.poll(count).toBe(2);
    await page.reload();
    await expect.poll(count).toBe(2);
  });
});
