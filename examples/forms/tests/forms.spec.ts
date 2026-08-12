import { test, expect } from "@playwright/test";

/** M6 forms: two-way binding, validation, in-place error display, submit + PRG. */
test.describe("M6 — forms", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  // Field errors surface via the native error-popup effect (t-error/t-error-popup),
  // not the Errors summary — Errors lists only unassociated errors.
  test("invalid submit shows validation errors in place (no navigation)", async ({ page }) => {
    await page.locator("#submit").click();
    for (const n of ["name", "email"]) {
      await expect(page.locator(`input[name=${n}]`)).toHaveClass(/t-error/);
    }
    await expect(
      page.locator(".t-error-popup", { hasText: "You must provide a value for Name." }),
    ).toBeVisible();
    await expect(page).toHaveURL("http://localhost:5187/");
  });

  test("field-level validator (email) reports only the offending field", async ({ page }) => {
    await page.locator("input[name=name]").fill("Ada");
    await page.locator("input[name=email]").fill("not-an-email");
    await page.locator("#submit").click();
    await expect(page.locator("input[name=email]")).toHaveClass(/t-error/);
    await expect(page.locator("input[name=name]")).not.toHaveClass(/t-error/);
    await expect(
      page.locator(".t-error-popup", { hasText: "Not a valid email address." }),
    ).toBeVisible();
  });

  test("valid submit: two-way binding + PRG navigation", async ({ page }) => {
    await page.locator("input[name=name]").fill("Ada");
    await page.locator("input[name=email]").fill("ada@example.com");
    await page.locator("#submit").click();
    await expect(page).toHaveURL(/\/thanks\/Ada\/10\/2026-08-01\/no$/); // name + default rows + date
    await expect(page.locator("#thanks")).toHaveText("Thanks, Ada!");
  });

  test("Select renders its model options with the bound value selected", async ({ page }) => {
    await expect(page.locator("select[name=rows] option")).toHaveText(["5", "10", "15", "20"]);
    await expect(page.locator("select[name=rows]")).toHaveValue("10");
  });

  test("Select two-way binds on submit", async ({ page }) => {
    await page.locator("input[name=name]").fill("Ada");
    await page.locator("input[name=email]").fill("ada@example.com");
    await page.locator("select[name=rows]").selectOption("20");
    await page.locator("#submit").click();
    await expect(page).toHaveURL(/\/thanks\/Ada\/20\/2026-08-01\/no$/); // select value carried through
  });

  test("DateField renders a native date input with the bound default value", async ({ page }) => {
    await expect(page.locator("input[name=checkin]")).toHaveAttribute("type", "date");
    await expect(page.locator("input[name=checkin]")).toHaveValue("2026-08-01");
  });

  test("DateField two-way binds on submit (value carried through PRG)", async ({ page }) => {
    await page.locator("input[name=name]").fill("Ada");
    await page.locator("input[name=email]").fill("ada@example.com");
    await page.locator("input[name=checkin]").fill("2026-12-25");
    await page.locator("#submit").click();
    await expect(page).toHaveURL(/\/thanks\/Ada\/10\/2026-12-25\/no$/);
    await expect(page.locator("#checkin")).toHaveText("Check-in: 2026-12-25");
  });

  test("RadioGroup renders radios sharing the group name, with the bound value checked", async ({ page }) => {
    await expect(page.locator("input[type=radio][name=smoking]")).toHaveCount(2);
    await expect(page.locator("input[name=smoking][value=no]")).toBeChecked(); // default
    await expect(page.locator("input[name=smoking][value=yes]")).not.toBeChecked();
  });

  test("RadioGroup two-way binds the selected radio on submit", async ({ page }) => {
    await page.locator("input[name=name]").fill("Ada");
    await page.locator("input[name=email]").fill("ada@example.com");
    await page.locator("input[name=smoking][value=yes]").check();
    await page.locator("#submit").click();
    await expect(page).toHaveURL(/\/thanks\/Ada\/10\/2026-08-01\/yes$/);
    await expect(page.locator("#smoking")).toHaveText("Smoking: yes");
  });

  test("throws no uncaught errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.locator("#submit").click();
    await page.waitForTimeout(200);
    expect(errors).toEqual([]);
  });
});
