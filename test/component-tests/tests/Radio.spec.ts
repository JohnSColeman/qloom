import { test, expect } from "@playwright/test";

// Source: integration/app1/FormTests.java — Radio / RadioGroup
test.describe("Radio", () => {
  // tapestry: radios in a RadioGroup share the group name
  test("radios share the RadioGroup name", async ({ page }) => {
    await page.goto("/radio");
    await expect(page.locator("input[type=radio][name=choice]")).toHaveCount(2);
  });

  // tapestry: the bound value's radio is checked
  test("the bound value's radio is checked", async ({ page }) => {
    await page.goto("/radio");
    await expect(page.locator("input[name=choice][value=no]")).toBeChecked();
    await expect(page.locator("input[name=choice][value=yes]")).not.toBeChecked();
  });

  // tapestry: RadioGroup two-way binds the selected value on submit (PRG)
  test("two-way binds the selected value on submit", async ({ page }) => {
    await page.goto("/radio");
    await page.locator("input[name=choice][value=yes]").check();
    await page.locator("#submit").click();
    await expect(page).toHaveURL(/\/radio-result\/yes$/);
    await expect(page.locator("#result")).toHaveText("Choice: yes");
  });

  // --- functional ---

  // tapestry: each Radio carries its own value attribute
  test("each radio carries its own value", async ({ page }) => {
    await page.goto("/radio");
    await expect(page.locator("input[name=choice][value=yes]")).toHaveCount(1);
    await expect(page.locator("input[name=choice][value=no]")).toHaveCount(1);
  });

  // tapestry: selecting a radio unchecks the others in the group (mutual exclusion)
  test("selecting one radio unchecks the others", async ({ page }) => {
    await page.goto("/radio");
    await page.locator("input[name=choice][value=yes]").check();
    await expect(page.locator("input[name=choice][value=yes]")).toBeChecked();
    await expect(page.locator("input[name=choice][value=no]")).not.toBeChecked();
  });

  // --- edge ---

  // tapestry: submitting without changing selection binds the bound default ("no")
  test("submitting unchanged binds the default value", async ({ page }) => {
    await page.goto("/radio");
    await page.locator("#submit").click();
    await expect(page).toHaveURL(/\/radio-result\/no$/);
    await expect(page.locator("#result")).toHaveText("Choice: no");
  });

  // --- chaos ---

  // tapestry: flipping the selection back and forth binds the LAST choice at submit
  test("flipping selection repeatedly binds the last choice", async ({ page }) => {
    await page.goto("/radio");
    const yes = page.locator("input[name=choice][value=yes]");
    const no = page.locator("input[name=choice][value=no]");
    for (let i = 0; i < 4; i++) {
      await yes.check();
      await no.check();
    }
    await yes.check(); // last selection → yes
    await page.locator("#submit").click();
    await expect(page).toHaveURL(/\/radio-result\/yes$/);
    await expect(page.locator("#result")).toHaveText("Choice: yes");
  });

  // tapestry: rendering a RadioGroup raises no page/console errors (fail-loud)
  test("renders without page or console errors", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") failures.push(m.text()); });
    await page.goto("/radio");
    await expect(page.locator("input[type=radio]")).toHaveCount(2);
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
