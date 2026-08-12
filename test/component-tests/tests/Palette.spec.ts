import { test, expect } from "@playwright/test";

// Source: integration/app1/PaletteTests.java — Palette.
test.describe("Palette", () => {
  // tapestry: palette_component — renders an available list and a selected list
  test("renders available and selected list boxes", async ({ page }) => {
    await page.goto("/palette");
    await expect(page.locator("select")).toHaveCount(2);
  });

  // tapestry: palette_component — the `selected` binding drives the split: a
  // pre-selected value sits in the selected list and is excluded from available.
  test("the selected binding splits options between the two lists", async ({ page }) => {
    await page.goto("/palette");
    // Available (first list) = model minus selected; Selected (second list) = the bound value.
    await expect(page.locator("select").first().locator("option")).toHaveText(["Red", "Blue"]);
    await expect(page.locator("select").nth(1).locator("option")).toHaveText(["Green"]);
    // The selected list carries the field name (its t:id) for form submission.
    await expect(page.locator("select[name=colors]").locator("option")).toHaveText(["Green"]);
  });

  // tapestry: palette_component — the "available" list carries the `<id>-available`
  // name so it is distinct from the submitted "selected" list.
  test("the available list is named <id>-available", async ({ page }) => {
    await page.goto("/palette");
    await expect(page.locator("select[name=colors-available]").locator("option")).toHaveText([
      "Red",
      "Blue",
    ]);
  });

  // tapestry: PaletteTests — submitting pulls the live "selected" list box back
  // into the bound collection (the two-way `selected` binding), carried via PRG.
  test("submit pulls the selected list into the bound collection", async ({ page }) => {
    await page.goto("/palette");
    await page.locator("#submit").click();
    await expect(page.locator("#chosen")).toHaveText("Green");
  });

  // edge — every option selected: the available list is empty, and the selected
  // list preserves the bound collection's order (Blue, Green, Red), not the
  // model's (Red, Green, Blue).
  test("all options selected leaves the available list empty, selected in bound order", async ({
    page,
  }) => {
    await page.goto("/palette-full");
    await expect(page.locator("select[name=colors-available]").locator("option")).toHaveCount(0);
    await expect(page.locator("select[name=colors]").locator("option")).toHaveText([
      "Blue",
      "Green",
      "Red",
    ]);
  });

  // chaos — rendering both list boxes must not raise console/page errors.
  test("renders without console or page errors", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/palette-full");
    await expect(page.locator("select")).toHaveCount(2);
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});

// Source: PaletteTests — moving options between the lists via the select/deselect
// buttons and double-click; reorder mode's up/down buttons. (BACKLOG #3.)
test.describe("Palette move controls", () => {
  const available = "select[name=colors-available]";
  const selected = "select[name=colors]";

  // the control buttons render (and, being type=button, do not submit the form)
  test("renders select and deselect buttons of type button", async ({ page }) => {
    await page.goto("/palette");
    await expect(page.locator(".t-palette-select")).toHaveAttribute("type", "button");
    await expect(page.locator(".t-palette-deselect")).toHaveAttribute("type", "button");
    // no reorder buttons in normal mode
    await expect(page.locator(".t-palette-up")).toHaveCount(0);
  });

  // tapestry: the select button moves highlighted available options to selected,
  // keeping the selected list in the model's natural order
  test("select button moves an option into the selected list in model order", async ({ page }) => {
    await page.goto("/palette");
    await page.locator(available).selectOption("Red");
    await page.locator(".t-palette-select").click();
    // Red is model-first, so selected becomes [Red, Green]; available drops to [Blue]
    await expect(page.locator(selected).locator("option")).toHaveText(["Red", "Green"]);
    await expect(page.locator(available).locator("option")).toHaveText(["Blue"]);
  });

  // tapestry: the deselect button moves highlighted selected options back to
  // available, reinserting them in model order
  test("deselect button moves an option back to available in model order", async ({ page }) => {
    await page.goto("/palette");
    await page.locator(selected).selectOption("Green");
    await page.locator(".t-palette-deselect").click();
    await expect(page.locator(selected).locator("option")).toHaveCount(0);
    await expect(page.locator(available).locator("option")).toHaveText(["Red", "Green", "Blue"]);
  });

  // tapestry: double-clicking an available option moves it to the selected list
  test("double-clicking an available option moves it across", async ({ page }) => {
    await page.goto("/palette");
    await page.locator(`${available} option`, { hasText: "Blue" }).dblclick();
    await expect(page.locator(selected).locator("option")).toHaveText(["Green", "Blue"]);
  });

  // functional: a move is reflected in the submitted collection (two-way binding)
  test("a moved option is carried into the submitted collection", async ({ page }) => {
    await page.goto("/palette");
    await page.locator(available).selectOption("Red");
    await page.locator(".t-palette-select").click();
    await page.locator("#submit").click();
    await expect(page.locator("#chosen")).toHaveText("Red,Green");
  });

  // tapestry (reorder mode): up/down buttons appear and reorder the selection,
  // and the reordered order is what gets submitted
  test("reorder mode's up button reorders the selection", async ({ page }) => {
    await page.goto("/palette-reorder");
    await expect(page.locator(".t-palette-up")).toBeVisible();
    // selected starts [Green, Red]; move Red up → [Red, Green]
    await page.locator(selected).selectOption("Red");
    await page.locator(".t-palette-up").click();
    await expect(page.locator(selected).locator("option")).toHaveText(["Red", "Green"]);
    await page.locator("#submit").click();
    await expect(page.locator("#chosen")).toHaveText("Red,Green");
  });

  // tapestry (reorder mode): a moved option appends to the bottom (not model order)
  test("reorder mode appends a moved option to the bottom", async ({ page }) => {
    await page.goto("/palette-reorder");
    // available is [Blue] (model Red,Green,Blue minus selected Green,Red)
    await page.locator(available).selectOption("Blue");
    await page.locator(".t-palette-select").click();
    // appended at the bottom, preserving the existing [Green, Red] order
    await expect(page.locator(selected).locator("option")).toHaveText(["Green", "Red", "Blue"]);
  });

  // chaos: moving options back and forth raises no errors
  test("moving options back and forth is error-free", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") failures.push(m.text()); });
    await page.goto("/palette");
    await page.locator(available).selectOption(["Red", "Blue"]);
    await page.locator(".t-palette-select").click();
    await expect(page.locator(available).locator("option")).toHaveCount(0);
    await page.locator(selected).selectOption(["Red", "Green", "Blue"]);
    await page.locator(".t-palette-deselect").click();
    await expect(page.locator(selected).locator("option")).toHaveCount(0);
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
