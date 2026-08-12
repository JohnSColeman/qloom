import { test, expect } from "@playwright/test";

// Source: corelib/components/OutputTest.java — Output.
test.describe("Output", () => {
  // tapestry: Output formats and writes its value
  test("writes its formatted value", async ({ page }) => {
    await page.goto("/output");
    await expect(page.locator("#out")).toHaveText("42");
  });
});

// Formatting, edge values, and the escape contract for Output.
test.describe("Output values", () => {
  // functional: a number value is stringified
  test("stringifies a number value", async ({ page }) => {
    await page.goto("/output-cases");
    await expect(page.locator("#out-num")).toHaveText("42");
  });

  // functional: a boolean false value renders the literal "false"
  test("renders a boolean false value", async ({ page }) => {
    await page.goto("/output-cases");
    await expect(page.locator("#out-flag")).toHaveText("false");
  });

  // edge: zero renders as "0", not as an empty string
  test("renders zero rather than blank", async ({ page }) => {
    await page.goto("/output-cases");
    await expect(page.locator("#out-zero")).toHaveText("0");
  });

  // edge: a null value renders as an empty string
  test("renders a null value as empty", async ({ page }) => {
    await page.goto("/output-cases");
    await expect(page.locator("#out-null")).toHaveText("");
  });

  // edge: an empty-string value renders as empty
  test("renders an empty-string value as empty", async ({ page }) => {
    await page.goto("/output-cases");
    await expect(page.locator("#out-blank")).toHaveText("");
  });

  // edge: HTML-special characters are escaped, not parsed into elements
  test("escapes HTML-special characters", async ({ page }) => {
    await page.goto("/output-cases");
    await expect(page.locator("#out-html")).toHaveText("<b>bold</b>");
    await expect(page.locator("#out-html b")).toHaveCount(0);
  });

  // chaos: a hostile value injected via a zone re-render stays escaped
  test("keeps a re-rendered hostile value escaped", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/output-cases");
    await expect(page.locator("#out-poisoned")).toHaveText("safe");
    await page.locator("#out-poison").click();
    await expect(page.locator("#out-poisoned")).toHaveText(
      '<img src=x onerror="window.__outputXss = true">',
    );
    await expect(page.locator("#out-poisoned img")).toHaveCount(0);
    await page.waitForLoadState("networkidle");
    expect(await page.evaluate(() => (window as unknown as { __outputXss?: boolean }).__outputXss)).toBeUndefined();
    expect(failures).toEqual([]);
  });
});
