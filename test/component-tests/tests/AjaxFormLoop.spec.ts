import { test, expect } from "@playwright/test";

// Source: integration/app1/AjaxTests.java#ajax_form_loop + remove_ajaxformloop_values_using_buttons.
test.describe("AjaxFormLoop", () => {
  // tapestry: ajax_form_loop — renders one editable row per source item
  test("renders a row per source item", async ({ page }) => {
    await page.goto("/ajaxformloop");
    await expect(page.locator(".row")).toHaveCount(2);
  });

  // tapestry: ajax_form_loop — AddRowLink adds a new row via Ajax
  test("AddRowLink adds a new row", async ({ page }) => {
    await page.goto("/ajaxformloop");
    await page.locator("#add-row").click();
    await expect(page.locator(".row")).toHaveCount(3);
  });

  // tapestry: remove_ajaxformloop_values_using_buttons — RemoveRowLink removes a row
  test("RemoveRowLink removes a row", async ({ page }) => {
    await page.goto("/ajaxformloop");
    await page.locator(".remove-row").first().click();
    await expect(page.locator(".row")).toHaveCount(1);
  });

  // --- functional -----------------------------------------------------------

  // tapestry: ajax_form_loop — each AddRowLink click appends one more row
  test("adding several rows appends one row per click", async ({ page }) => {
    await page.goto("/ajaxformloop");
    await expect(page.locator(".row")).toHaveCount(2);
    await page.locator("#add-row").click();
    await page.locator("#add-row").click();
    await page.locator("#add-row").click();
    await expect(page.locator(".row")).toHaveCount(5);
  });

  // tapestry: remove_ajaxformloop_values_using_buttons — removing a middle row
  // drops exactly one row (the loop re-renders in place around the survivors).
  test("removing a middle row drops exactly that one row", async ({ page }) => {
    await page.goto("/ajaxformloop");
    await page.locator("#add-row").click(); // 3 rows
    await expect(page.locator(".row")).toHaveCount(3);
    await page.locator(".remove-row").nth(1).click();
    await expect(page.locator(".row")).toHaveCount(2);
  });

  // tapestry (keyed reconciler): each row carries a stable data-key so the
  // reconciler matches rows by identity, not position.
  test("each row carries a stable data-key", async ({ page }) => {
    await page.goto("/ajaxformloop");
    const keys = await page.locator(".row").evaluateAll((rows) =>
      rows.map((r) => r.getAttribute("data-key")),
    );
    expect(keys.every((k) => typeof k === "string" && k.length > 0)).toBe(true);
    expect(new Set(keys).size).toBe(keys.length); // unique per row
  });

  // tapestry (keyed reconciler): removing a MIDDLE row keeps the surviving rows'
  // typed values by identity — the value follows the item, not the position.
  // (Positional matching would leave "aaa","bbb" here; keyed leaves "aaa","ccc".)
  test("removing a middle row keeps the surviving rows' values by identity", async ({ page }) => {
    await page.goto("/ajaxformloop");
    await page.locator("#add-row").click(); // 3 rows
    await page.locator(".row input").nth(0).fill("aaa");
    await page.locator(".row input").nth(1).fill("bbb");
    await page.locator(".row input").nth(2).fill("ccc");
    await page.locator(".remove-row").nth(1).click(); // remove the middle row (bbb)
    await expect(page.locator(".row")).toHaveCount(2);
    await expect(page.locator(".row input").nth(0)).toHaveValue("aaa");
    await expect(page.locator(".row input").nth(1)).toHaveValue("ccc");
  });

  // tapestry: reconciler — editing existing rows then adding a row preserves the
  // already-typed (uncontrolled) input values on the surviving row nodes. Rows
  // here are unkeyed, so the in-place patch reuses nodes positionally; the dirty
  // .value survives the attribute-only patch of the reused node.
  test("adding a row preserves the values typed into existing rows", async ({ page }) => {
    await page.goto("/ajaxformloop");
    await page.locator(".row input").nth(0).fill("alpha");
    await page.locator(".row input").nth(1).fill("bravo");
    await page.locator("#add-row").click();
    await expect(page.locator(".row")).toHaveCount(3);
    await expect(page.locator(".row input").nth(0)).toHaveValue("alpha");
    await expect(page.locator(".row input").nth(1)).toHaveValue("bravo");
  });

  // --- edge -----------------------------------------------------------------

  // tapestry: removing the LAST row leaves the earlier rows (and, positionally,
  // their edited values) intact.
  test("removing the last row keeps the earlier rows' values", async ({ page }) => {
    await page.goto("/ajaxformloop");
    await page.locator(".row input").nth(0).fill("keep-me");
    await page.locator(".remove-row").nth(1).click(); // drop the 2nd (last) row
    await expect(page.locator(".row")).toHaveCount(1);
    await expect(page.locator(".row input").nth(0)).toHaveValue("keep-me");
  });

  // tapestry: removing every row empties the loop without error, and the
  // AddRowLink (a sibling outside the loop) still works to repopulate it.
  test("removing down to zero rows empties the loop and can be repopulated", async ({ page }) => {
    await page.goto("/ajaxformloop");
    await page.locator(".remove-row").first().click();
    await page.locator(".remove-row").first().click();
    await expect(page.locator(".row")).toHaveCount(0);
    await page.locator("#add-row").click();
    await expect(page.locator(".row")).toHaveCount(1);
  });

  // tapestry: add a row then immediately remove it — count returns to the start.
  test("adding then removing a row returns to the original count", async ({ page }) => {
    await page.goto("/ajaxformloop");
    await page.locator("#add-row").click();
    await expect(page.locator(".row")).toHaveCount(3);
    await page.locator(".remove-row").last().click();
    await expect(page.locator(".row")).toHaveCount(2);
  });

  // --- chaos ----------------------------------------------------------------

  // tapestry: rapid add/remove churn — a marked survivor row keeps its edited
  // value and the loop settles at the right count, with no runtime errors.
  test("rapid add/remove churn preserves a survivor's value and stays fail-loud", async ({
    page,
  }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });

    await page.goto("/ajaxformloop");
    await page.locator(".row input").nth(0).fill("survivor");
    for (let i = 0; i < 4; i++) await page.locator("#add-row").click();
    await expect(page.locator(".row")).toHaveCount(6);
    for (let i = 0; i < 3; i++) await page.locator(".remove-row").last().click();
    await expect(page.locator(".row")).toHaveCount(3);
    await expect(page.locator(".row input").nth(0)).toHaveValue("survivor");

    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
