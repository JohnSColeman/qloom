import { test, expect } from "@playwright/test";

// Source: LoopTests — encoded/volatile loop inside a form round-trips edited values.
// Qloom does this over the live in-memory source (no ValueEncoder/formdata needed).
test.describe("Loop of fields in a form", () => {
  // tapestry: each row's field two-way-binds to that row; submit round-trips ALL edits
  test("each row's edit round-trips to the collection on submit", async ({ page }) => {
    await page.goto("/loop-form");
    const inputs = page.locator("input.rn");
    await expect(inputs).toHaveCount(3);
    await inputs.nth(0).fill("ALPHA");
    await inputs.nth(2).fill("GAMMA");
    await page.locator("#save").click();
    // row 0 and row 2 edited, row 1 (beta) untouched — no clobbering across rows
    await expect(page.locator("#result")).toHaveText("ALPHA,beta,GAMMA");
  });

  // edge: editing every row writes each to its own item, in order
  test("editing all rows writes each to its own item", async ({ page }) => {
    await page.goto("/loop-form");
    const inputs = page.locator("input.rn");
    await inputs.nth(0).fill("one");
    await inputs.nth(1).fill("two");
    await inputs.nth(2).fill("three");
    await page.locator("#save").click();
    await expect(page.locator("#result")).toHaveText("one,two,three");
  });
});

// AjaxFormLoop uses the same row-context path; editing existing rows round-trips too.
test.describe("AjaxFormLoop in a form", () => {
  test("editing existing rows round-trips each edit on submit", async ({ page }) => {
    await page.goto("/ajaxloop-submit");
    const inputs = page.locator("input.an");
    await expect(inputs).toHaveCount(2);
    await inputs.nth(0).fill("AA");
    await inputs.nth(1).fill("BB");
    await page.locator("#save").click();
    await expect(page.locator("#result")).toHaveText("AA,BB");
  });
});

// Nested loop inside a loop inside a form: the inner loop saves/restores the
// enclosing row context, so every field round-trips to its own nested item.
test.describe("Nested loop in a form", () => {
  test("each nested row's edit round-trips to its own item on submit", async ({ page }) => {
    await page.goto("/nested-loop-form");
    const inputs = page.locator("input.nn");
    await expect(inputs).toHaveCount(4); // 2 groups × 2 items
    await inputs.nth(0).fill("A1"); // group 0, item 0
    await inputs.nth(3).fill("B2"); // group 1, item 1
    await page.locator("#save").click();
    // only the two edited nested items change; the other two are untouched
    await expect(page.locator("#result")).toHaveText("A1+a2,b1+B2");
  });
});
