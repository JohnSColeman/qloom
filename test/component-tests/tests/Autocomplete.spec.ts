import { test, expect } from "@playwright/test";

// Ported from Tapestry Autocomplete. A mixin on a text field asks the page for
// completions as the user types and shows them in a dropdown. Qloom deletes the
// server round-trip: the page's onProvideCompletionsFrom<Id> supplies matches
// (sync or async); the mixin renders the menu, handles keyboard/mouse selection,
// and guards against out-of-order async responses. Each field's menu carries
// data-autocomplete-for=<field> so the two menus on the page are addressable.
const menuFor = (field: string) => `.t-autocomplete-menu[data-autocomplete-for=${field}]`;
const itemsFor = (field: string) => `${menuFor(field)} .t-autocomplete-item`;

test.describe("Autocomplete mixin (type-ahead over a page-supplied source)", () => {
  test("shows matching completions once minChars is reached; nothing before", async ({ page }) => {
    await page.goto("/autocomplete");
    const city = page.locator("input[name=city]");
    await city.click();
    await city.pressSequentially("L"); // 1 char < minChars(2)
    await expect(page.locator(menuFor("city"))).toBeHidden();
    await city.pressSequentially("o"); // "Lo" → matches
    await expect(page.locator(menuFor("city"))).toBeVisible();
    await expect(page.locator(itemsFor("city")).filter({ hasText: "London" }).first()).toBeVisible();
  });

  test("caps the menu at maxSuggestions", async ({ page }) => {
    await page.goto("/autocomplete");
    const city = page.locator("input[name=city]");
    await city.click();
    await city.pressSequentially("Lo"); // London, Londonderry, Los Angeles → capped to 2
    await expect(page.locator(itemsFor("city"))).toHaveCount(2);
    await expect(page.locator(itemsFor("city")).filter({ hasText: "Los Angeles" })).toHaveCount(0);
  });

  test("keyboard: arrow-down twice + Enter selects the second item", async ({ page }) => {
    await page.goto("/autocomplete");
    const city = page.locator("input[name=city]");
    await city.click();
    await city.pressSequentially("Lo");
    await expect(page.locator(menuFor("city"))).toBeVisible();
    await city.press("ArrowDown");
    await city.press("ArrowDown");
    await city.press("Enter");
    await expect(city).toHaveValue("Londonderry");
    await expect(page.locator(menuFor("city"))).toBeHidden();
  });

  test("clicking an item fills the field and updates the bound property", async ({ page }) => {
    await page.goto("/autocomplete");
    const city = page.locator("input[name=city]");
    await city.click();
    await city.pressSequentially("Lo");
    await page.locator(itemsFor("city")).filter({ hasText: "London" }).first().click();
    await expect(city).toHaveValue("London");
    await page.locator("#submit").click();
    await expect(page).toHaveURL(/\/submit-result\/London$/);
  });

  test("stale async responses are discarded (out-of-order guard)", async ({ page }) => {
    await page.goto("/autocomplete");
    const fruit = page.locator("input[name=fruit]");
    await fruit.click();
    await fruit.pressSequentially("a"); // fires the SLOW (300ms) query for "a"
    await page.waitForTimeout(90); // > debounce(50): the "a" query is now in flight
    await fruit.pressSequentially("p"); // "ap" → FAST (40ms) query
    await page.waitForTimeout(90); // "ap" resolved → menu shows apple, apricot
    await expect(page.locator(itemsFor("fruit")).filter({ hasText: "apricot" })).toBeVisible();
    // wait past when the slow "a" query resolves — it must NOT clobber the menu
    await page.waitForTimeout(300);
    await expect(page.locator(itemsFor("fruit")).filter({ hasText: "avocado" })).toHaveCount(0);
    await expect(page.locator(itemsFor("fruit")).filter({ hasText: "apricot" })).toBeVisible();
  });

  test("teardown: navigating away leaves no menu and no errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.goto("/autocomplete");
    const city = page.locator("input[name=city]");
    await city.click();
    await city.pressSequentially("Lo");
    await expect(page.locator(menuFor("city"))).toBeVisible();
    await page.goto("/environmental"); // leave
    await page.waitForTimeout(200);
    await expect(page.locator(".t-autocomplete-menu")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});
