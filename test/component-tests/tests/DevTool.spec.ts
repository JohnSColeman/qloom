import { test, expect } from "@playwright/test";

// Source: component reference — DevTool renders a dev-options menu.
test.describe("DevTool", () => {
  // tapestry: DevTool offers dev-time options (e.g. reload the current page)
  test("renders a dev-options menu with a reload option", async ({ page }) => {
    await page.goto("/devtool");
    await expect(page.locator("#devtool")).toBeAttached();
    await expect(page.getByText(/reload/i)).toBeVisible();
  });

  // The reload option is an actionable <button> (not just text), inside the
  // devtool container.
  test("the reload option is a clickable button inside the menu", async ({ page }) => {
    await page.goto("/devtool");
    const reload = page.locator("#devtool button.devtool-reload");
    await expect(reload).toBeVisible();
    await expect(reload).toHaveText(/reload/i);
    // Don't click — it calls location.reload(); asserting it's enabled is enough.
    await expect(reload).toBeEnabled();
  });

  // Fail-loud: the devtool renders with no console errors.
  test("the devtool renders with no console errors", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/devtool");
    await expect(page.locator("#devtool")).toBeAttached();
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
