import { test, expect } from "@playwright/test";

// Source: integration/app1/FormTests.java — PasswordField (TextField variant)
test.describe("PasswordField", () => {
  // tapestry: PasswordField renders an <input type="password">
  test("renders an input[type=password]", async ({ page }) => {
    await page.goto("/passwordfield");
    await expect(page.locator("input[name=secret]")).toHaveAttribute("type", "password");
  });

  // tapestry: PasswordField two-way binds its value on submit (PRG)
  test("two-way binds the value on submit", async ({ page }) => {
    await page.goto("/passwordfield");
    await page.locator("input[name=secret]").fill("hunter2");
    await page.locator("#submit").click();
    await expect(page).toHaveURL(/\/passwordfield-result\/hunter2$/);
    await expect(page.locator("#result")).toHaveText("Secret: hunter2");
  });

  // --- functional -------------------------------------------------------------

  // tapestry: a pre-filled property renders as a masked password value
  test("renders a pre-filled masked value", async ({ page }) => {
    await page.goto("/passwordfield-validate");
    const saved = page.locator("input[name=saved]");
    await expect(saved).toHaveAttribute("type", "password");
    await expect(saved).toHaveValue("cached");
  });

  // tapestry: a valid value satisfying required + minlength submits (PRG)
  test("valid value submits (PRG)", async ({ page }) => {
    await page.goto("/passwordfield-validate");
    await page.locator("input[name=pin]").fill("1234"); // len 4 == minlength
    await page.locator("#submit").click();
    await expect(page).toHaveURL(/\/passwordfield-result\/1234$/);
    await expect(page.locator("#result")).toHaveText("Secret: 1234");
  });

  // --- edge --------------------------------------------------------------------

  // tapestry: required blocks an empty submit and shows the field error popup
  test("required rejects an empty password", async ({ page }) => {
    await page.goto("/passwordfield-validate");
    await page.locator("#submit").click();
    await expect(page.locator("input[name=pin]")).toHaveClass(/t-error/);
    await expect(
      page.locator(".t-error-popup", { hasText: "You must provide a value for Pin." }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/passwordfield-validate$/);
  });

  // tapestry: on a blocked submit the form moves focus to the first invalid field
  test("focuses the invalid field on a blocked submit", async ({ page }) => {
    await page.goto("/passwordfield-validate");
    // `saved` (field 0) takes initial focus; the blocked submit moves it to `pin`.
    await expect(page.locator("input[name=saved]")).toBeFocused();
    await page.locator("#submit").click();
    await expect(page.locator("input[name=pin]")).toBeFocused();
  });

  // tapestry: minlength below the bound blocks with its message
  test("minlength below the bound blocks with its message", async ({ page }) => {
    await page.goto("/passwordfield-validate");
    await page.locator("input[name=pin]").fill("ab"); // len 2 < 4
    await page.locator("#submit").click();
    await expect(
      page.locator(".t-error-popup", {
        hasText: "You must provide at least 4 characters for Pin.",
      }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/passwordfield-validate$/);
  });

  // tapestry: whitespace-only fails required (trim)
  test("required rejects a whitespace-only password", async ({ page }) => {
    await page.goto("/passwordfield-validate");
    await page.locator("input[name=pin]").fill("   ");
    await page.locator("#submit").click();
    await expect(page.locator("input[name=pin]")).toHaveClass(/t-error/);
    await expect(page).toHaveURL(/\/passwordfield-validate$/);
  });

  // --- chaos -------------------------------------------------------------------

  // tapestry: correcting a rejected password and re-submitting clears the error
  test("re-submit after correcting clears the error (fail-loud)", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/passwordfield-validate");
    await page.locator("#submit").click();
    await expect(page.locator("input[name=pin]")).toHaveClass(/t-error/);
    await page.locator("input[name=pin]").fill("1234");
    await page.locator("#submit").click();
    await expect(page.locator("#result")).toHaveText("Secret: 1234");
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
