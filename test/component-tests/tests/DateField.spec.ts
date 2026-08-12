import { test, expect } from "@playwright/test";

// Source: integration/app1/FormTests.java — DateField
test.describe("DateField", () => {
  // tapestry: DateField renders a date input with the bound value
  test("renders a native date input with the bound value", async ({ page }) => {
    await page.goto("/datefield");
    await expect(page.locator("input[name=checkin]")).toHaveAttribute("type", "date");
    await expect(page.locator("input[name=checkin]")).toHaveValue("2026-08-01");
  });

  // tapestry: DateField two-way binds the value on submit (PRG)
  test("two-way binds the value on submit", async ({ page }) => {
    await page.goto("/datefield");
    await page.locator("input[name=checkin]").fill("2026-12-25");
    await page.locator("#submit").click();
    await expect(page).toHaveURL(/\/datefield-result\/2026-12-25$/);
    await expect(page.locator("#result")).toHaveText("Check-in: 2026-12-25");
  });

  // --- edge ---

  // tapestry: DateField bound to an empty value renders an empty date input
  test("renders empty when bound value is empty", async ({ page }) => {
    await page.goto("/datefield-empty");
    await expect(page.locator("input[name=checkin]")).toHaveAttribute("type", "date");
    await expect(page.locator("input[name=checkin]")).toHaveValue("");
  });

  // tapestry: an empty DateField, once filled, binds the chosen date on submit (PRG)
  test("empty DateField binds a date once filled and submitted", async ({ page }) => {
    await page.goto("/datefield-empty");
    await page.locator("input[name=checkin]").fill("2027-01-15");
    await page.locator("#submit").click();
    await expect(page).toHaveURL(/\/datefield-result\/2027-01-15$/);
    await expect(page.locator("#result")).toHaveText("Check-in: 2027-01-15");
  });

  // tapestry: a native date control refuses a non-date string (value stays empty)
  test("rejects an invalid date string", async ({ page }) => {
    await page.goto("/datefield-empty");
    await page.locator("input[name=checkin]").evaluate((el) => {
      (el as HTMLInputElement).value = "not-a-date";
    });
    await expect(page.locator("input[name=checkin]")).toHaveValue("");
  });

  // --- chaos ---

  // tapestry: re-filling the date settles on the LAST value at submit
  test("re-filling repeatedly binds the last date", async ({ page }) => {
    await page.goto("/datefield");
    const input = page.locator("input[name=checkin]");
    await input.fill("2026-09-09");
    await input.fill("2026-10-10");
    await input.fill("2026-11-11"); // last value wins
    await page.locator("#submit").click();
    await expect(page).toHaveURL(/\/datefield-result\/2026-11-11$/);
    await expect(page.locator("#result")).toHaveText("Check-in: 2026-11-11");
  });

  // tapestry: rendering a DateField raises no page/console errors (fail-loud)
  test("renders without page or console errors", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") failures.push(m.text()); });
    await page.goto("/datefield");
    await expect(page.locator("input[name=checkin]")).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
