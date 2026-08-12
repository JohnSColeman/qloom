import { test, expect } from "@playwright/test";

/**
 * `<t:block>` + `<t:delegate>`: named blocks are hoisted onto the instance and
 * render nothing where they appear; a `<t:delegate to="step">` renders whichever
 * block the page's `step` getter returns. EventLinks refresh the enclosing Zone,
 * switching the delegated block in place — the Book page's multi-step pattern.
 */
test.describe("<t:block> + <t:delegate> — multi-step wizard", () => {
  test("a named block renders only via delegate, not where it is defined", async ({ page }) => {
    await page.goto("/wizard");
    await expect(page.locator("#which")).toHaveCount(1); // only the delegated block
    await expect(page.locator("#which")).toHaveText("Step one: your details");
  });

  test("EventLinks switch the delegated block in place (Zone refresh)", async ({ page }) => {
    await page.goto("/wizard");
    await expect(page.locator("#which")).toHaveText("Step one: your details");
    await expect(page.locator("#next")).toBeVisible();

    await page.locator("#next").click();
    await expect(page.locator("#which")).toHaveText("Step two: confirm");
    await expect(page.locator("#back")).toBeVisible();

    await page.locator("#back").click();
    await expect(page.locator("#which")).toHaveText("Step one: your details");
  });
});
