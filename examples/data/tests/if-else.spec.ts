import { test, expect } from "@playwright/test";

/**
 * `<t:if>` then/else blocks: when the test passes the body (the "then") renders;
 * when it fails, the `<p:else>` block renders instead.
 */
test.describe("If — then/else blocks", () => {
  test("renders the body when true and the <p:else> block when false", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#cond-then")).toHaveText("yes"); // hasHotels → then
    await expect(page.locator("#cond-else")).toHaveText("b"); //  never → else
  });
});
