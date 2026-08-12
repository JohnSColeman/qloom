import { test, expect } from "@playwright/test";

// Source: integration/app1/BeanEditorTests.java — PropertyDisplay (used by BeanDisplay).
test.describe("PropertyDisplay", () => {
  // tapestry: PropertyDisplay outputs the single property value
  test("outputs the single property value", async ({ page }) => {
    await page.goto("/propertydisplay");
    await expect(page.locator("#pd")).toHaveText("Hilton Downtown");
  });
});

// Value formatting, missing/null handling, and the escape contract.
test.describe("PropertyDisplay values", () => {
  // functional: a number property is stringified
  test("stringifies a number property", async ({ page }) => {
    await page.goto("/propertydisplay-cases");
    await expect(page.locator("#pd-count")).toHaveText("7");
  });

  // functional: a boolean false property renders the literal "false"
  test("renders a boolean false property", async ({ page }) => {
    await page.goto("/propertydisplay-cases");
    await expect(page.locator("#pd-active")).toHaveText("false");
  });

  // edge: a null property value renders as empty
  test("renders a null property value as empty", async ({ page }) => {
    await page.goto("/propertydisplay-cases");
    await expect(page.locator("#pd-nil")).toHaveText("");
  });

  // edge: a property missing from the object renders as empty
  test("renders a missing property as empty", async ({ page }) => {
    await page.goto("/propertydisplay-cases");
    await expect(page.locator("#pd-missing")).toHaveText("");
  });

  // edge: a null object renders as empty without crashing
  test("renders empty for a null object", async ({ page }) => {
    await page.goto("/propertydisplay-cases");
    await expect(page.locator("#pd-nullobj")).toHaveText("");
  });

  // edge: HTML-special characters in the value are escaped
  test("escapes HTML-special characters in the value", async ({ page }) => {
    await page.goto("/propertydisplay-cases");
    await expect(page.locator("#pd-title")).toHaveText("<b>hi</b>");
    await expect(page.locator("#pd-title b")).toHaveCount(0);
  });

  // chaos: a hostile value injected via a zone re-render stays escaped
  test("keeps a re-rendered hostile value escaped", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/propertydisplay-cases");
    await expect(page.locator("#pd-live")).toHaveText("safe");
    await page.locator("#pd-poison").click();
    await expect(page.locator("#pd-live img")).toHaveCount(0);
    await page.waitForLoadState("networkidle");
    expect(await page.evaluate(() => (window as unknown as { __pdXss?: boolean }).__pdXss)).toBeUndefined();
    expect(failures).toEqual([]);
  });
});
