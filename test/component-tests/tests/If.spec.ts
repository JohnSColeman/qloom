import { test, expect } from "@playwright/test";

// Source: mined from integration/app1/CoreBehaviorsTests.java (If then/else).
test.describe("If", () => {
  // tapestry: CoreBehaviorsTests — If renders its body when the test is true
  test("renders then-body when test is true", async ({ page }) => {
    await page.goto("/if-unless");
    await expect(page.locator("#if-then")).toHaveText("shown");
  });

  // tapestry: CoreBehaviorsTests — If renders the else block when test is false
  test("renders else block when test is false", async ({ page }) => {
    await page.goto("/if-unless");
    await expect(page.locator("#if-else")).toHaveText("fallback");
  });

  // tapestry: AbstractConditional — negate inverts the test (true+negate → else)
  test("negate inverts a true test to render the else block", async ({ page }) => {
    await page.goto("/if-unless");
    await expect(page.locator("#if-negate-else")).toHaveText("else-shown");
  });

  // tapestry: AbstractConditional — negate inverts a false test to render the then
  test("negate inverts a false test to render the then-body", async ({ page }) => {
    await page.goto("/if-unless");
    await expect(page.locator("#if-negate-then")).toHaveText("then-shown");
  });

  // tapestry: If renders nothing when test is false and no else block is given
  test("renders nothing when test is false and no else block", async ({ page }) => {
    await page.goto("/if-unless");
    await expect(page.locator("#if-noelse-false")).toHaveText("");
  });

  // tapestry: If renders the then-body when test is true and no else block
  test("renders then-body when test is true and no else block", async ({ page }) => {
    await page.goto("/if-unless");
    await expect(page.locator("#if-noelse-true")).toHaveText("yep");
  });

  // chaos: the conditional page must render without any error surfacing
  test("renders all branches without errors", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/if-unless");
    await expect(page.locator("#if-then")).toHaveText("shown");
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
