import { test, expect } from "@playwright/test";

// @Parameter({ defaultPrefix }) — a *bare* parameter value is read per the child
// component's declared default: `literal` takes the raw string, `prop` (the
// default) treats it as a property expression. An explicit prefix always wins.
test.describe("@Parameter defaultPrefix", () => {
  // mode declares defaultPrefix="literal" → bare "cancel" is the raw string.
  // label defaults to prop → bare "greeting" reads the container property ("Hi").
  test("a literal-default param takes the raw value; a prop-default reads the property", async ({
    page,
  }) => {
    await page.goto("/prefix");
    await expect(page.locator("#row-default .pt")).toHaveText("cancel/Hi");
  });

  // explicit prefixes override the declared defaults: mode="prop:greeting" reads
  // the property; label="literal:Lit" is the raw string.
  test("an explicit prefix overrides the declared defaultPrefix", async ({ page }) => {
    await page.goto("/prefix");
    await expect(page.locator("#row-explicit .pt")).toHaveText("Hi/Lit");
  });

  // chaos: rendering both rows raises no page or console errors
  test("renders defaultPrefix components without errors", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") failures.push(m.text()); });
    await page.goto("/prefix");
    await expect(page.locator("#row-default .pt")).toHaveText("cancel/Hi");
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
