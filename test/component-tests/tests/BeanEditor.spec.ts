import { test, expect } from "@playwright/test";

// Source: integration/app1/BeanEditorTests.java + corelib BeanEditorTest.
test.describe("BeanEditor", () => {
  // tapestry: BeanEditForm generates a field per included bean property, with a
  // humanised label and the bean's current value pre-filled.
  test("generates a labelled, pre-filled input per bean property", async ({ page }) => {
    await page.goto("/beaneditor");
    await expect(page.locator("input[name=firstName]")).toHaveValue("Ada");
    await expect(page.locator("input[name=lastName]")).toHaveValue("Lovelace");
    // Labels are humanised property names (regression guard: a dropped label or
    // lost pre-fill previously passed a visible-only check).
    await expect(page.locator("label")).toHaveText(["First Name", "Last Name"]);
  });

  // tapestry: BeanEditForm renders its own submit control
  test("renders a submit control", async ({ page }) => {
    await page.goto("/beaneditor");
    await expect(page.locator("input[type=submit]")).toBeVisible();
  });

  // edge: `include` selects exactly the listed properties (in order) — no stray
  // fields are generated for un-included keys.
  test("generates exactly one text input per included property", async ({ page }) => {
    await page.goto("/beaneditor");
    await expect(page.locator("form input[type=text]")).toHaveCount(2);
    await expect(page.locator("form input[type=text]").first()).toHaveAttribute("name", "firstName");
    await expect(page.locator("form input[type=text]").nth(1)).toHaveAttribute("name", "lastName");
  });

  // functional: BeanEditForm pulls the edited field values back into the bean
  // before firing submit — the edited firstName rides the PRG to the result page.
  test("submitting pulls edited values back into the bean", async ({ page }) => {
    await page.goto("/beaneditor");
    await page.locator("input[name=firstName]").fill("Grace");
    await page.locator("input[type=submit]").click();
    await expect(page).toHaveURL(/\/submit-result\/Grace$/);
    await expect(page.locator("#result")).toHaveText("Submitted: Grace");
  });

  // chaos: generating the editor from a bean must not raise a console/page error.
  test("rendering the bean editor is error-free", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/beaneditor");
    await expect(page.locator("input[name=firstName]")).toHaveValue("Ada");
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
