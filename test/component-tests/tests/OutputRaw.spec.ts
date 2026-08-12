import { test, expect } from "@playwright/test";

// Source: corelib/components/OutputRawTest.java — OutputRaw.
test.describe("OutputRaw", () => {
  // tapestry: OutputRaw writes unescaped markup (a real <b> element, not text)
  test("writes unescaped markup", async ({ page }) => {
    await page.goto("/outputraw");
    await expect(page.locator("#raw b")).toHaveText("bold");
  });
});

// The raw contrast to Output: real elements, decoded entities, null handling.
test.describe("OutputRaw values", () => {
  // functional: markup is parsed into a real element (contrast with Output)
  test("parses markup into a real element", async ({ page }) => {
    await page.goto("/outputraw-cases");
    await expect(page.locator("#raw-bold b")).toHaveText("bold");
  });

  // functional: multiple sibling elements are all rendered
  test("renders multiple sibling elements", async ({ page }) => {
    await page.goto("/outputraw-cases");
    await expect(page.locator("#raw-multi i")).toHaveCount(2);
  });

  // functional: HTML entities are decoded (a &amp; b -> a & b)
  test("decodes HTML entities", async ({ page }) => {
    await page.goto("/outputraw-cases");
    await expect(page.locator("#raw-entity")).toHaveText("a & b");
  });

  // edge: a null value renders as empty without crashing
  test("renders a null value as empty", async ({ page }) => {
    await page.goto("/outputraw-cases");
    await expect(page.locator("#raw-null")).toHaveText("");
  });

  // chaos: swapping the raw markup via a zone re-render replaces the element
  test("re-renders swapped raw markup", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/outputraw-cases");
    await expect(page.locator("#raw-live-1")).toHaveText("one");
    await page.locator("#raw-swap").click();
    await expect(page.locator("#raw-live-2")).toHaveText("two");
    await expect(page.locator("#raw-live-1")).toHaveCount(0);
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
