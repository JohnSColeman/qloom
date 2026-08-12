import { test, expect } from "@playwright/test";

/** Grid: columns from `include`, cell overrides, and rowsPerPage pagination. */
test.describe("Grid — tabular rendering + pagination", () => {
  test("renders headers, a page of rows, and the priceCell override", async ({ page }) => {
    await page.goto("/grid");
    await expect(page.locator("table.t-data-grid thead th")).toHaveText(["Name", "City", "Price"]);
    await expect(page.locator("table.t-data-grid tbody tr")).toHaveCount(2); // rowsPerPage=2, page 1
    await expect(page.locator("table.t-data-grid tbody tr").first().locator("td")).toHaveText([
      "Marriott Courtyard",
      "Atlanta",
      "$120",
    ]);
  });

  test("the pager switches pages and re-renders the table in place", async ({ page }) => {
    await page.goto("/grid");
    // 3 hotels / 2 per page = 2 pages. Tapestry-faithful pager: the current page renders as
    // plain text (span.current), other pages as links — so page 1 shows exactly one link (page 2).
    await expect(page.locator(".t-data-grid-pager span.current")).toHaveText("1");
    await expect(page.locator(".t-data-grid-pager a")).toHaveCount(1);
    await page.locator(".t-data-grid-pager a").click(); // → page 2
    await expect(page.locator(".t-data-grid-pager span.current")).toHaveText("2");
    await expect(page.locator("table.t-data-grid tbody tr")).toHaveCount(1);
    await expect(page.locator("table.t-data-grid tbody tr").first().locator("td").first()).toHaveText(
      "Hôtel Rouge",
    );
  });
});
