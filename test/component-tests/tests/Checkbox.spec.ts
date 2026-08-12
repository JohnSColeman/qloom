import { test, expect } from "@playwright/test";

// Source: integration/app1/FormTests.java — Checkbox.
test.describe("Checkbox", () => {
  // tapestry: FormTests — Checkbox renders an <input type="checkbox">
  test("renders an input[type=checkbox]", async ({ page }) => {
    await page.goto("/checkbox");
    await expect(page.locator("input[type=checkbox]")).toBeVisible();
  });

  // tapestry: FormTests#validate_checkbox_must_be_checked (checked → true, PRG)
  test("two-way binds the boolean on submit (checked → true)", async ({ page }) => {
    await page.goto("/checkbox");
    await page.locator("input[type=checkbox]").check();
    await page.locator("#submit").click();
    await expect(page).toHaveURL(/\/checkbox-result\/true$/);
    await expect(page.locator("#value")).toHaveText("Checkbox's value: true");
  });

  // tapestry: FormTests#validate_checkbox_must_be_unchecked (unchecked → false, PRG)
  test("two-way binds the boolean on submit (unchecked → false)", async ({ page }) => {
    await page.goto("/checkbox");
    await page.locator("#submit").click();
    await expect(page).toHaveURL(/\/checkbox-result\/false$/);
    await expect(page.locator("#value")).toHaveText("Checkbox's value: false");
  });

  // --- functional ---

  // tapestry: a Checkbox bound to `false` renders unchecked
  test("renders unchecked when bound value is false", async ({ page }) => {
    await page.goto("/checkbox");
    await expect(page.locator("input[type=checkbox]")).not.toBeChecked();
  });

  // tapestry: a Checkbox bound to `true` renders pre-checked
  test("renders checked when bound value is true", async ({ page }) => {
    await page.goto("/checkbox-checked");
    await expect(page.locator("input[type=checkbox]")).toBeChecked();
  });

  // tapestry: a pre-checked Checkbox toggled off then submitted binds false (PRG)
  test("pre-checked box toggled off binds false on submit", async ({ page }) => {
    await page.goto("/checkbox-checked");
    await page.locator("input[type=checkbox]").uncheck();
    await page.locator("#submit").click();
    await expect(page).toHaveURL(/\/checkbox-result\/false$/);
    await expect(page.locator("#value")).toHaveText("Checkbox's value: false");
  });

  // --- chaos ---

  // tapestry: repeated toggling settles on the LAST state at submit (checked wins here)
  test("toggling repeatedly then submit binds the last state", async ({ page }) => {
    await page.goto("/checkbox");
    const box = page.locator("input[type=checkbox]");
    for (let i = 0; i < 5; i++) {
      await box.check();
      await box.uncheck();
    }
    await box.check(); // last action → true
    await page.locator("#submit").click();
    await expect(page).toHaveURL(/\/checkbox-result\/true$/);
    await expect(page.locator("#value")).toHaveText("Checkbox's value: true");
  });

  // tapestry: rendering a Checkbox raises no page/console errors (fail-loud)
  test("renders without page or console errors", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") failures.push(m.text()); });
    await page.goto("/checkbox");
    await expect(page.locator("input[type=checkbox]")).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
