import { test, expect } from "@playwright/test";

// Ported from Tapestry TriggerFragment. A mixin on a form control drives a
// FormFragment's visibility; because Qloom's Form excludes a hidden fragment's
// fields at submit, hiding the fragment also drops its required field from
// validation — conditional form sections for free.
test.describe("TriggerFragment mixin (a control toggles a FormFragment)", () => {
  test("the fragment is visible when the trigger is unchecked (invert)", async ({ page }) => {
    await page.goto("/trigger-fragment");
    await expect(page.locator("input[name=shippingCity]")).toBeVisible();
  });

  test("checking the trigger hides the fragment; unchecking reveals it", async ({ page }) => {
    await page.goto("/trigger-fragment");
    const box = page.locator("input[name=sameAddress]");
    await box.check();
    await expect(page.locator("input[name=shippingCity]")).toBeHidden();
    await box.uncheck();
    await expect(page.locator("input[name=shippingCity]")).toBeVisible();
  });

  test("while visible, the fragment's required field blocks submit", async ({ page }) => {
    await page.goto("/trigger-fragment");
    await page.locator("#submit").click();
    await expect(page.locator("input[name=shippingCity]")).toHaveClass(/t-error/);
    await expect(page).toHaveURL(/\/trigger-fragment$/);
  });

  test("hiding the fragment via the trigger excludes its required field from submit", async ({ page }) => {
    await page.goto("/trigger-fragment");
    // hide the fragment → its required field is excluded → the blank field no longer blocks
    await page.locator("input[name=sameAddress]").check();
    await expect(page.locator("input[name=shippingCity]")).toBeHidden();
    await page.locator("#submit").click();
    await expect(page).toHaveURL(/\/submit-result\/blank$/);
  });
});
