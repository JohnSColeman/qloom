import { test, expect } from "@playwright/test";

// Source: integration/app1/GridTests.java
test.describe("Grid", () => {
  // tapestry: GridTests — headers from the model, a page of rows, cell override
  test("renders headers, a page of rows, and the priceCell override", async ({ page }) => {
    await page.goto("/grid");
    await expect(page.locator("table.t-data-grid thead th")).toHaveText(["Name", "City", "Price"]);
    await expect(page.locator("table.t-data-grid tbody tr")).toHaveCount(2); // rowsPerPage=2
    await expect(page.locator("table.t-data-grid tbody tr").first().locator("td")).toHaveText([
      "Alpha",
      "Atlanta",
      "$120",
    ]);
  });

  // tapestry: GridTests — the pager switches pages and re-renders in place
  test("the pager switches pages and re-renders the table in place", async ({ page }) => {
    await page.goto("/grid");
    // 3 rows / 2 per page = 2 pages. Tapestry-faithful pager: the current page renders as plain
    // text (span.current), other pages as links — so page 1 shows exactly one link (page 2).
    await expect(page.locator(".t-data-grid-pager span.current")).toHaveText("1");
    await expect(page.locator(".t-data-grid-pager a")).toHaveCount(1);
    await page.locator(".t-data-grid-pager a").click(); // → page 2
    await expect(page.locator(".t-data-grid-pager span.current")).toHaveText("2");
    await expect(page.locator("table.t-data-grid tbody tr")).toHaveCount(1);
    await expect(
      page.locator("table.t-data-grid tbody tr").first().locator("td").first(),
    ).toHaveText("Gamma");
  });

  // tapestry: GridTests — the pager navigates forward and back, re-rendering in place
  test("the pager navigates to a later page and back to the first", async ({ page }) => {
    await page.goto("/grid");
    await page.locator(".t-data-grid-pager a").click(); // page 1 → 2
    await expect(page.locator(".t-data-grid-pager span.current")).toHaveText("2");
    await page.locator(".t-data-grid-pager a").click(); // the only link now is page 1
    await expect(page.locator(".t-data-grid-pager span.current")).toHaveText("1");
    await expect(
      page.locator("table.t-data-grid tbody tr").first().locator("td").first(),
    ).toHaveText("Alpha");
  });

  // tapestry: GridTests — clicking an include-column header sorts the rows,
  // toggling ascending → descending, and resets to the first page.
  test("clicking a column header sorts ascending then descending", async ({ page }) => {
    await page.goto("/grid");
    const priceHeader = page.locator("th", { hasText: "Price" });
    await priceHeader.locator("a").click(); // ascending by price: 95, 120, 200
    await expect(priceHeader).toHaveAttribute("data-grid-column-sort", "ascending");
    await expect(
      page.locator("table.t-data-grid tbody tr").first().locator("td").first(),
    ).toHaveText("Beta"); // $95, first on the ascending first page
    await priceHeader.locator("a").click(); // descending: 200, 120, 95
    await expect(priceHeader).toHaveAttribute("data-grid-column-sort", "descending");
    await expect(
      page.locator("table.t-data-grid tbody tr").first().locator("td").first(),
    ).toHaveText("Gamma"); // $200, first on the descending first page
  });

  // edge — a source that fits one page renders no pager; the `add` column ("note")
  // is not backed by a row property so it is not sortable (no header link).
  test("a single-page grid has no pager and the add column is not sortable", async ({ page }) => {
    await page.goto("/grid-single");
    await expect(page.locator(".t-data-grid-pager")).toHaveCount(0);
    await expect(page.locator("table.t-data-grid tbody tr")).toHaveCount(2);
    await expect(page.locator("thead th")).toHaveText(["Name", "City", "Note"]);
    await expect(page.locator("th", { hasText: "Name" }).locator("a")).toHaveCount(1);
    await expect(page.locator("th", { hasText: "Note" }).locator("a")).toHaveCount(0);
    await expect(page.locator("th[data-grid-column-sort]")).toHaveCount(2);
  });

  // edge — an empty source renders the p:empty block instead of a table.
  test("an empty source renders the empty block and no table", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/grid-empty");
    await expect(page.locator("table.t-data-grid")).toHaveCount(0);
    await expect(page.locator("#empty-msg")).toBeVisible();
    await expect(page.locator("div.t-data-grid")).toContainText("There is no data to display.");
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });

  // chaos — sorting and paging must not raise console/page errors.
  test("sorting and paging raise no errors", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/grid");
    await page.locator("th", { hasText: "Name" }).locator("a").click();
    await page.locator(".t-data-grid-pager a").click();
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
