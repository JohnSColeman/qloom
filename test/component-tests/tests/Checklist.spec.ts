import { test, expect } from "@playwright/test";

// Source: integration/app1/FormTests.java — Checklist.
test.describe("Checklist", () => {
  // tapestry: Checklist renders a checkbox per model option
  test("renders a checkbox per model option", async ({ page }) => {
    await page.goto("/checklist");
    await expect(page.locator("input[type=checkbox]")).toHaveCount(3);
  });

  // tapestry: Checklist labels each checkbox with its option
  test("labels each checkbox with its option", async ({ page }) => {
    await page.goto("/checklist");
    await expect(page.getByText("Red")).toBeVisible();
    await expect(page.getByText("Green")).toBeVisible();
    await expect(page.getByText("Blue")).toBeVisible();
  });

  // tapestry: Checklist two-way binds the collection of checked values on submit
  test("two-way binds the checked values on submit", async ({ page }) => {
    await page.goto("/checklist");
    await page.locator("input[type=checkbox][value=Green]").check();
    await page.locator("input[type=checkbox][value=Blue]").check();
    await page.locator("#submit").click();
    // PRG carries the bound `selected` collection to the result page.
    await expect(page.locator("#chosen")).toHaveText("Green,Blue");
  });

  // --- functional ---

  // tapestry: a pre-populated `selected` collection renders those boxes checked
  test("renders pre-selected values checked", async ({ page }) => {
    await page.goto("/checklist-state");
    await expect(page.locator("input[type=checkbox][value=Green]")).toBeChecked();
    await expect(page.locator("input[type=checkbox][value=Red]")).not.toBeChecked();
    await expect(page.locator("input[type=checkbox][value=Blue]")).not.toBeChecked();
  });

  // tapestry: unchecking a pre-selected box drops it from the bound collection (PRG)
  test("unchecking a pre-selected box removes it on submit", async ({ page }) => {
    await page.goto("/checklist-state");
    await page.locator("input[type=checkbox][value=Green]").uncheck();
    await page.locator("#submit").click();
    await expect(page.locator("#chosen")).toBeEmpty();
  });

  // --- edge ---

  // tapestry: submitting with nothing checked binds an empty collection (PRG)
  test("submitting nothing binds an empty collection", async ({ page }) => {
    await page.goto("/checklist");
    await page.locator("#submit").click();
    await expect(page.locator("#chosen")).toBeEmpty();
  });

  // tapestry: a Checklist over an empty model renders zero checkboxes, no crash
  test("empty model renders zero checkboxes", async ({ page }) => {
    await page.goto("/checklist-empty");
    await expect(page.locator("input[type=checkbox]")).toHaveCount(0);
  });

  // --- chaos ---

  // tapestry: repeated toggling settles on the LAST checked set at submit
  test("toggling repeatedly binds the last checked set", async ({ page }) => {
    await page.goto("/checklist");
    const red = page.locator("input[type=checkbox][value=Red]");
    const green = page.locator("input[type=checkbox][value=Green]");
    const blue = page.locator("input[type=checkbox][value=Blue]");
    await red.check();
    await red.uncheck();
    await blue.check();
    await green.check();
    await blue.uncheck(); // final state: only Green checked
    await page.locator("#submit").click();
    await expect(page.locator("#chosen")).toHaveText("Green");
  });

  // tapestry: an empty/null model raises no page or console errors (fail-loud)
  test("empty model renders without page or console errors", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") failures.push(m.text()); });
    await page.goto("/checklist-empty");
    await expect(page.locator("input[type=checkbox]")).toHaveCount(0);
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
