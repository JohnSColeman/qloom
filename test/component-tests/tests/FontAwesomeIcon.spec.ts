import { test, expect } from "@playwright/test";

// Source: component reference — FontAwesomeIcon renders an <i> with a fa CSS class.
test.describe("FontAwesomeIcon", () => {
  // tapestry: FontAwesomeIcon renders an <i> with the icon's fa CSS class
  test("renders an <i> with the FontAwesome class", async ({ page }) => {
    await page.goto("/fontawesomeicon");
    await expect(page.locator("i#icon")).toHaveClass(/fa-star/);
  });
});

// Exact class composition and informal pass-through.
test.describe("FontAwesomeIcon attributes", () => {
  // functional: the class is exactly "fa fa-<icon>"
  test("composes the class as fa fa-<icon>", async ({ page }) => {
    await page.goto("/fontawesomeicon");
    await expect(page.locator("i#icon2")).toHaveClass("fa fa-user");
  });

  // functional: an informal title attribute passes through
  test("passes an informal title through", async ({ page }) => {
    await page.goto("/fontawesomeicon");
    await expect(page.locator("i#icon2")).toHaveAttribute("title", "Profile");
  });

  // functional: an informal data-* attribute passes through
  test("passes an informal data-* attribute through", async ({ page }) => {
    await page.goto("/fontawesomeicon");
    await expect(page.locator("i#icon2")).toHaveAttribute("data-role", "avatar");
  });

  // edge: the fa class overrides any informal class on the element
  test("overrides an informal class with the fa class", async ({ page }) => {
    await page.goto("/fontawesomeicon");
    await expect(page.locator("i#icon2")).not.toHaveClass(/ignored-class/);
  });
});
