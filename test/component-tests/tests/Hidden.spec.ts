import { test, expect } from "@playwright/test";

// Source: corelib/components/HiddenTest.java + FormTests — Hidden.
test.describe("Hidden", () => {
  // tapestry: Hidden renders an <input type="hidden"> carrying the property value
  test("renders an input[type=hidden] with the property value", async ({ page }) => {
    await page.goto("/hidden");
    await expect(page.locator("input[type=hidden][name=token]")).toHaveValue("abc123");
  });

  // tapestry: Hidden round-trips its value through a form submit (PRG)
  test("round-trips its value through submit", async ({ page }) => {
    await page.goto("/hidden");
    await page.locator("#submit").click();
    await expect(page.locator("#result")).toHaveText("Token: abc123");
  });

  // --- functional -------------------------------------------------------------

  // tapestry: several Hidden fields each carry their own property value
  test("renders multiple hidden fields with their values", async ({ page }) => {
    await page.goto("/hidden-edge");
    await expect(page.locator("input[name=count]")).toHaveValue("42");
    await expect(page.locator("input[name=markup]")).toHaveAttribute("type", "hidden");
  });

  // tapestry: a plain Hidden value round-trips through the PRG context
  test("round-trips a plain value through submit", async ({ page }) => {
    await page.goto("/hidden-edge");
    await page.locator("#submit").click();
    await expect(page.locator("#result")).toHaveText("Token: 42");
  });

  // --- edge --------------------------------------------------------------------

  // tapestry: an empty property renders a blank hidden input (no value attribute)
  test("renders a blank value for an empty property", async ({ page }) => {
    await page.goto("/hidden-edge");
    await expect(page.locator("input[name=blank]")).toHaveValue("");
  });

  // tapestry: an HTML/script-bearing value is set via setAttribute — inert, no injection
  test("renders a script-bearing value inert (no injection)", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/hidden-edge");
    await expect(page.locator("input[name=markup]")).toHaveValue(
      '<img src=x onerror="window.__hacked=true">',
    );
    await expect(page.locator("form img")).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __hacked?: boolean }).__hacked)).toBeUndefined();
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });

  // --- chaos -------------------------------------------------------------------

  // tapestry: repeated submits keep round-tripping the same value (fail-loud)
  test("survives repeated submits with no console errors", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/hidden-edge");
    await page.locator("#submit").click();
    await expect(page.locator("#result")).toHaveText("Token: 42");
    await page.goto("/hidden-edge");
    await page.locator("#submit").click();
    await expect(page.locator("#result")).toHaveText("Token: 42");
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
