import { test, expect } from "@playwright/test";

// Source: corelib/components/PropertyEditorTest.java — PropertyEditor.
test.describe("PropertyEditor", () => {
  // tapestry: PropertyEditor edits a single property, rendering its field
  test("renders an editor field for the single property", async ({ page }) => {
    await page.goto("/propertyeditor");
    await expect(page.locator("input[name=firstName]")).toBeVisible();
  });

  // tapestry: PropertyEditor seeds the field with the current property value
  test("seeds the field with the current property value", async ({ page }) => {
    await page.goto("/propertyeditor");
    await expect(page.locator("input[name=firstName]")).toHaveValue("Ada");
  });
});

// Multiple editors, empty-value handling, and informal pass-through.
test.describe("PropertyEditor fields", () => {
  // functional: multiple editors render one field per property
  test("renders a distinct field per edited property", async ({ page }) => {
    await page.goto("/propertyeditor");
    await expect(page.locator("input[name=firstName]")).toBeVisible();
    await expect(page.locator("input[name=lastName]")).toBeVisible();
    await expect(page.locator("input[name=middleName]")).toBeVisible();
  });

  // edge: an empty property value omits the value attribute
  test("omits the value attribute for an empty property", async ({ page }) => {
    await page.goto("/propertyeditor");
    expect(await page.locator("input[name=middleName]").getAttribute("value")).toBeNull();
  });

  // functional: an informal attribute passes through onto the input
  test("passes an informal attribute through to the input", async ({ page }) => {
    await page.goto("/propertyeditor");
    await expect(page.locator("input[name=lastName]")).toHaveAttribute("placeholder", "Surname");
  });
});
