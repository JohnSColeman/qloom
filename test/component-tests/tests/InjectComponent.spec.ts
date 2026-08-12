import { test, expect } from "@playwright/test";

// @InjectComponent resolves an embedded component by t:id (default = field name)
// and makes the instance available to the host's event handlers.
test.describe("@InjectComponent", () => {
  test("resolves the embedded child; handler calls a method on it", async ({ page }) => {
    await page.goto("/injectcomponent");
    await expect(page.locator("#result")).toHaveText(""); // not yet invoked
    await expect(page.locator("span.marker")).toHaveText("marker"); // child rendered

    await page.locator("input[type=submit]").click();
    // greet() ran on the injected instance → "resolved" (would be "null" if unresolved)
    await expect(page.locator("#result")).toHaveText("resolved");
  });

  // Fail-loud: resolving the injected child and invoking through it logs nothing.
  test("resolving and invoking the injected child produces no console errors", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/injectcomponent");
    await page.locator("input[type=submit]").click();
    await expect(page.locator("#result")).toHaveText("resolved");
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
