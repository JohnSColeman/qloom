import { test, expect } from "@playwright/test";

// Source: corelib/components/AnyTest.java — Any.
test.describe("Any", () => {
  // tapestry: Any renders the element named by its `element` parameter
  test("renders the element named by the element parameter", async ({ page }) => {
    await page.goto("/any");
    await expect(page.locator("section#any-el")).toHaveText("hello");
  });

  // tapestry: Any passes through informal parameters onto the rendered element
  test("passes informal parameters through to the element", async ({ page }) => {
    await page.goto("/any");
    await expect(page.locator("section#any-el")).toHaveClass(/marker/);
  });

  // edge: element defaults to "div" when the element parameter is unbound
  test("defaults to a div element when element is unbound", async ({ page }) => {
    await page.goto("/any");
    await expect(page.locator("div#any-default")).toHaveText("defaulted");
  });

  // edge: multiple informal attributes (class/title/data-*) all pass through
  test("passes multiple informal attributes through", async ({ page }) => {
    await page.goto("/any");
    const el = page.locator("#any-informals");
    await expect(el).toHaveClass(/a b/);
    await expect(el).toHaveAttribute("title", "tool tip");
    await expect(el).toHaveAttribute("data-role", "a widget");
  });

  // functional: the element name can be bound dynamically via prop:
  test("renders an element named by a bound property", async ({ page }) => {
    await page.goto("/any");
    await expect(page.locator("article#any-dynamic")).toHaveText("dyn");
  });

  // chaos: the page renders all Any variants without any error surfacing
  test("renders all element variants without errors", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/any");
    await expect(page.locator("section#any-el")).toHaveText("hello");
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
