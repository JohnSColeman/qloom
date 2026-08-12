import { test, expect } from "@playwright/test";

// An informal HTML attribute on an element-form component (<t:textfield
// placeholder="Your name"/>) must compile and render as a literal attribute —
// it previously threw at compile time (force-parsed as a PEL expression).
test.describe("element-form informal attributes", () => {
  test("a bare placeholder renders on the input", async ({ page }) => {
    await page.goto("/element-informal");
    const input = page.locator("input[name=name]");
    await expect(input).toHaveAttribute("placeholder", "Your name");
    await expect(input).toHaveAttribute("title", "Enter your full name");
  });

  // functional: a data-* informal attribute passes through
  test("a data-* attribute renders on the input", async ({ page }) => {
    await page.goto("/element-informal");
    await expect(page.locator("input[name=secret]")).toHaveAttribute("data-testid", "pw");
  });

  // functional: a numeric-looking informal attribute renders literally
  test("a maxlength attribute renders on the input", async ({ page }) => {
    await page.goto("/element-informal");
    await expect(page.locator("input[name=secret]")).toHaveAttribute("maxlength", "12");
  });

  // functional: informal attributes work on a second (host-form) component type
  test("informal attributes render on a passwordfield", async ({ page }) => {
    await page.goto("/element-informal");
    await expect(page.locator("input[name=secret]")).toHaveAttribute("placeholder", "Password");
  });
});
