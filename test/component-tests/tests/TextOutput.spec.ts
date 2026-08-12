import { test, expect } from "@playwright/test";

// Source: corelib/components/TextOutputTest.java — TextOutput.
test.describe("TextOutput", () => {
  // tapestry: TextOutput splits text into lines, each in its own <p>
  test("splits text into one paragraph per line", async ({ page }) => {
    await page.goto("/textoutput");
    await expect(page.locator("#textout p")).toHaveText(["alpha", "beta"]);
  });
});

// Line-splitting edge cases and the per-line escape contract.
test.describe("TextOutput values", () => {
  // functional: a single line yields exactly one paragraph
  test("wraps a single line in one paragraph", async ({ page }) => {
    await page.goto("/textoutput-cases");
    await expect(page.locator("#to-single p")).toHaveCount(1);
    await expect(page.locator("#to-single p")).toHaveText("just one line");
  });

  // edge: an empty string yields a single empty paragraph
  test("renders one empty paragraph for an empty string", async ({ page }) => {
    await page.goto("/textoutput-cases");
    await expect(page.locator("#to-blank p")).toHaveCount(1);
    await expect(page.locator("#to-blank p")).toHaveText("");
  });

  // edge: a null value yields a single empty paragraph without crashing
  test("renders one empty paragraph for a null value", async ({ page }) => {
    await page.goto("/textoutput-cases");
    await expect(page.locator("#to-null p")).toHaveCount(1);
    await expect(page.locator("#to-null p")).toHaveText("");
  });

  // edge: each line is escaped, so HTML-special characters do not form elements
  test("escapes HTML-special characters per line", async ({ page }) => {
    await page.goto("/textoutput-cases");
    await expect(page.locator("#to-html p")).toHaveCount(2);
    await expect(page.locator("#to-html p").first()).toHaveText("<b>x</b>");
    await expect(page.locator("#to-html b")).toHaveCount(0);
  });
});
