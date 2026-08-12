import { test, expect } from "@playwright/test";

// @Parameter({ value }) — a default *binding expression* used when a parameter is
// unbound (and has no field initializer): message:/literal:/bare-prop, evaluated
// at read time. A real binding in the template overrides it.
test.describe("@Parameter value (default binding)", () => {
  // unbound: label ← message:demo.label ("Hello from catalog"), note ← literal:
  // "fallback", derived ← bare "greeting" (prop) → the container's greeting ("Hi")
  test("unbound parameters fall back to their value= default binding", async ({ page }) => {
    await page.goto("/default-value");
    await expect(page.locator("#row-unbound .dv")).toHaveText("Hello from catalog|fallback|Hi");
  });

  // a real binding in the template wins over the value= default
  test("a bound parameter overrides its value= default", async ({ page }) => {
    await page.goto("/default-value");
    await expect(page.locator("#row-bound .dv")).toHaveText("Bound!|fallback|Hi");
  });

  // chaos: rendering value-defaulted components raises no errors
  test("renders value-defaulted components without errors", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") failures.push(m.text()); });
    await page.goto("/default-value");
    await expect(page.locator("#row-unbound .dv")).toHaveText("Hello from catalog|fallback|Hi");
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
