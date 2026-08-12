import { test, expect } from "@playwright/test";

// An onActivate redirect must REPLACE the current history entry, not push it —
// otherwise Back re-activates the redirecting URL, which redirects forward again,
// trapping the user. (Router redirect-after-activate semantics.)
test.describe("redirect history", () => {
  test("Back skips past a redirecting page instead of being trapped", async ({ page }) => {
    await page.goto("/redirect-start");
    await expect(page.locator("#start")).toBeVisible();

    // Navigate through the redirector → it redirects to redirect-target.
    await page.locator("#go").click();
    await expect(page).toHaveURL(/\/redirect-target$/);
    await expect(page.locator("#target")).toBeVisible();

    // Back must land on the start page — NOT bounce back to redirect-target
    // (which is what happens if the redirect pushed instead of replaced).
    await page.goBack();
    await expect(page).toHaveURL(/\/redirect-start$/);
    await expect(page.locator("#start")).toBeVisible();
  });

  // Because the redirector's entry was REPLACED by redirect-target, Forward from
  // start lands directly on redirect-target (the redirector URL is not in the
  // stack at all).
  test("Forward from start reaches the redirect target, skipping the redirector", async ({
    page,
  }) => {
    await page.goto("/redirect-start");
    await page.locator("#go").click();
    await expect(page).toHaveURL(/\/redirect-target$/);

    await page.goBack();
    await expect(page).toHaveURL(/\/redirect-start$/);

    await page.goForward();
    await expect(page).toHaveURL(/\/redirect-target$/);
    await expect(page.locator("#target")).toBeVisible();
  });

  // Reloading the destination re-resolves it directly (deep-link safe) and does
  // not bounce back through the redirector.
  test("reloading the redirect target stays put (no re-redirect loop)", async ({ page }) => {
    await page.goto("/redirect-start");
    await page.locator("#go").click();
    await expect(page).toHaveURL(/\/redirect-target$/);

    await page.reload();
    await expect(page).toHaveURL(/\/redirect-target$/);
    await expect(page.locator("#target")).toBeVisible();
  });
});
