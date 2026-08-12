import { test, expect } from "@playwright/test";

// Source: integration/app1/BeanEditorTests.java (nested_bean_editor_and_bean_display)
test.describe("BeanDisplay", () => {
  // tapestry: BeanDisplay renders a <dl> with humanized dt labels
  test("renders humanized property labels as dt elements", async ({ page }) => {
    await page.goto("/beandisplay");
    await expect(page.locator("dl.t-beandisplay dt")).toHaveText(["Name", "City", "Stars"]);
  });

  // tapestry: BeanDisplay renders each property value as a dd element
  test("renders property values as dd elements in include order", async ({ page }) => {
    await page.goto("/beandisplay");
    await expect(page.locator("dl.t-beandisplay dd")).toHaveText(["Hilton Downtown", "Chicago", "4"]);
  });
});

// Humanization, per-property classes, block overrides, exclude, and escaping.
test.describe("BeanDisplay cases", () => {
  // functional: camelCase property names are humanized into multi-word labels
  test("humanizes camelCase property names in dt labels", async ({ page }) => {
    await page.goto("/beandisplay-cases");
    await expect(page.locator("#bd-main dt")).toHaveText([
      "Full Name",
      "Star Rating",
      "Ocean View",
      "Nightly Rate",
    ]);
  });

  // functional: each dt carries the property id as a CSS class
  test("tags each dt with the property id as a class", async ({ page }) => {
    await page.goto("/beandisplay-cases");
    await expect(page.locator("#bd-main dt.nightlyRate")).toHaveText("Nightly Rate");
  });

  // functional: each dd carries the property id as a CSS class
  test("tags each dd with the property id as a class", async ({ page }) => {
    await page.goto("/beandisplay-cases");
    await expect(page.locator("#bd-main dd.nightlyRate")).toHaveText("199");
  });

  // functional: a boolean value renders the literal "true"
  test("renders a boolean value in its dd", async ({ page }) => {
    await page.goto("/beandisplay-cases");
    await expect(page.locator("#bd-main dd.oceanView")).toHaveText("true");
  });

  // functional: a <p:property> block overrides how that property renders
  test("renders a p:block override instead of the raw value", async ({ page }) => {
    await page.goto("/beandisplay-cases");
    await expect(page.locator("#bd-main dd.starRating #bd-stars-custom")).toHaveText("five stars");
  });

  // functional: an informal class is merged with the built-in t-beandisplay class
  test("merges an informal class with t-beandisplay", async ({ page }) => {
    await page.goto("/beandisplay-cases");
    await expect(page.locator("#bd-main")).toHaveClass(/t-beandisplay/);
    await expect(page.locator("#bd-main")).toHaveClass(/hotel-details/);
  });

  // edge: an HTML-special value is escaped in the dd
  test("escapes an HTML-special value in the dd", async ({ page }) => {
    await page.goto("/beandisplay-cases");
    await expect(page.locator("#bd-main dd.fullName")).toHaveText("Grand <Hotel>");
    await expect(page.locator("#bd-main dd.fullName b")).toHaveCount(0);
  });

  // edge: an excluded property is omitted from the <dl>
  test("omits an excluded property", async ({ page }) => {
    await page.goto("/beandisplay-cases");
    await expect(page.locator("#bd-exclude dt")).toHaveText(["Name"]);
  });

  // edge: a null object renders an empty <dl> without crashing
  test("renders an empty dl for a null object", async ({ page }) => {
    await page.goto("/beandisplay-cases");
    await expect(page.locator("#bd-empty")).toHaveCount(1);
    await expect(page.locator("#bd-empty dt")).toHaveCount(0);
  });
});
