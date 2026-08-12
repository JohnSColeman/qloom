import { test, expect } from "@playwright/test";

/** Form `t:zone` refreshes the named zone with the handler's result (Ajax). */
test.describe("Form → Zone refresh (Ajax search)", () => {
  test("submitting filters the hotels and the results zone re-renders in place", async ({ page }) => {
    await page.goto("/search-demo");
    await expect(page.locator("#count")).toHaveText("3 result(s)");
    await expect(page.locator("#result-list .result")).toHaveCount(3);

    await page.locator("input[name=query]").fill("hil");
    await page.locator("#go").click();

    await expect(page.locator("#count")).toHaveText("1 result(s)");
    await expect(page.locator("#result-list .result")).toHaveText(["Hilton Downtown"]);
  });
});
