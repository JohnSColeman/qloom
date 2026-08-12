import { test, expect } from "@playwright/test";

/**
 * M5 regression gate: the OpenAPI spec → generated typed client → page →
 * mock `fetch` pipeline, end to end. No entity classes, no DAO — just the
 * committed spec and the generated `dal/` client.
 */
test.describe("M5 — spec-driven data (generated client → mock backend)", () => {
  test("lists hotels from the generated searchHotels operation", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#hotel-list li")).toHaveCount(3);
    await expect(page.locator("#hotel-list li").first()).toContainText("Marriott Courtyard");
  });

  test("PageLink context produces a per-hotel href", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Hilton Downtown" })).toHaveAttribute("href", "/hotel/2");
  });

  test("loads one hotel by activation-context id (getHotel)", async ({ page }) => {
    await page.goto("/hotel/2");
    await expect(page.locator("#hotel-name")).toHaveText("Hilton Downtown");
    await expect(page.locator("#hotel-meta")).toContainText("$210");
  });

  test("navigating from the list loads the detail", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Hôtel Rouge" }).click();
    await expect(page).toHaveURL(/\/hotel\/3$/);
    await expect(page.locator("#hotel-name")).toHaveText("Hôtel Rouge");
  });

  test("throws no uncaught errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);
  });
});
