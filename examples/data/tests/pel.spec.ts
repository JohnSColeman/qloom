import { test, expect } from "@playwright/test";

test.describe("PEL — method calls and ranges", () => {
  test("a method call and a range render through the engine", async ({ page }) => {
    await page.goto("/pel");
    await expect(page.locator("#pel-method")).toHaveText("HELLO"); // ${label()} uppercases "hello"
    await expect(page.locator("#pel-range li")).toHaveCount(3); // range 1..3
    await expect(page.locator("#pel-range li").first()).toHaveText("page 1");
  });
});
