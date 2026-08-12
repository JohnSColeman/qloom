import { test, expect } from "@playwright/test";

// Source: component reference — SubmitNotifier.
test.describe("SubmitNotifier", () => {
  // tapestry: SubmitNotifier notifies its container during a form submission
  test("notifies its container during form submission", async ({ page }) => {
    await page.goto("/submitnotifier");
    await page.locator("#submit").click();
    await expect(page).toHaveURL(/\/submitnotifier-result\/true$/);
    await expect(page.locator("#result")).toHaveText("Notified: true");
  });

  // --- edge -----------------------------------------------------------------

  // tapestry: SubmitNotifier is non-visual — it registers a submit hook but
  // renders no markup, so the form's only element child is the submit control.
  test("renders no markup (non-visual)", async ({ page }) => {
    await page.goto("/submitnotifier");
    await expect(page.locator("form > *")).toHaveCount(1);
    await expect(page.locator("form > #submit")).toBeAttached();
  });

  // tapestry: with no submission yet, the notify flag has not been raised.
  test("does not notify before any submission", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });

    await page.goto("/submitnotifier");
    // Still on the demo page (no PRG has fired) and no result element exists.
    await expect(page).toHaveURL(/\/submitnotifier$/);
    await expect(page.locator("#result")).toHaveCount(0);

    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
