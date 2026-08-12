import { test, expect } from "@playwright/test";

// onPassivate (and @PageActivationContext) values may be objects with an id.
// The router must encode them via ctxToString (→ the id), not pre-stringify with
// String() (→ "[object Object]"). Regression for the passivation double-String bug.
test.describe("passivation object context", () => {
  test("an { id } passivate value is encoded as its id, not [object Object]", async ({ page }) => {
    await page.goto("/passivate-object");
    await expect(page.locator("#po")).toBeVisible();
    await expect(page).toHaveURL(/\/passivate-object\/7$/);
  });

  // Reload the canonicalised URL: it must re-passivate to the same /7 (stable,
  // reconstruct-safe), not drift or corrupt to [object Object].
  test("reloading the canonical URL re-passivates to the same id", async ({ page }) => {
    await page.goto("/passivate-object");
    await expect(page).toHaveURL(/\/passivate-object\/7$/);
    await page.reload();
    await expect(page.locator("#po")).toBeVisible();
    await expect(page).toHaveURL(/\/passivate-object\/7$/);
  });

  // Fail-loud: the passivation round-trip logs no errors, and the URL never
  // shows the "[object Object]" corruption.
  test("passivation produces no console errors", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/passivate-object");
    await expect(page).toHaveURL(/\/passivate-object\/7$/);
    expect(page.url()).not.toContain("object%20Object");
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
