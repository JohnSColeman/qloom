import { test, expect } from "@playwright/test";

// Source: integration/app1/FormTests.java + SelectTest (Select model + binding)
test.describe("Select", () => {
  // tapestry: Select renders its model options
  test("renders the model options", async ({ page }) => {
    await page.goto("/select");
    await expect(page.locator("select[name=rows] option")).toHaveText(["5", "10", "15", "20"]);
  });

  // tapestry: Select renders with the bound value selected
  test("renders with the bound value selected", async ({ page }) => {
    await page.goto("/select");
    await expect(page.locator("select[name=rows]")).toHaveValue("10");
  });

  // tapestry: Select two-way binds the chosen value on submit (PRG)
  test("two-way binds the chosen value on submit", async ({ page }) => {
    await page.goto("/select");
    await page.locator("select[name=rows]").selectOption("20");
    await page.locator("#submit").click();
    await expect(page).toHaveURL(/\/select-result\/20$/);
    await expect(page.locator("#result")).toHaveText("Rows: 20");
  });

  // --- functional ---

  // tapestry: a non-default option is selectable and round-trips through submit (PRG)
  test("a mid-list option is selectable and round-trips", async ({ page }) => {
    await page.goto("/select");
    await page.locator("select[name=rows]").selectOption("15");
    await page.locator("#submit").click();
    await expect(page).toHaveURL(/\/select-result\/15$/);
    await expect(page.locator("#result")).toHaveText("Rows: 15");
  });

  // tapestry: an {label,value} OptionModel renders labels but the bound VALUE selects
  test("renders option labels while binding the value", async ({ page }) => {
    await page.goto("/select-model");
    await expect(page.locator("select[name=fruit] option")).toHaveText([
      "Apple <b>fresh</b>",
      "Banana",
      "Cherry",
    ]);
    // bound value "b" (not the label "Banana") selects the Banana option
    await expect(page.locator("select[name=fruit]")).toHaveValue("b");
  });

  // tapestry: choosing an option binds its VALUE, not its label (value encoder, PRG)
  test("binds the option value not its label on submit", async ({ page }) => {
    await page.goto("/select-model");
    await page.locator("select[name=fruit]").selectOption({ label: "Cherry" });
    await page.locator("#submit").click();
    await expect(page).toHaveURL(/\/select-result\/c$/);
    await expect(page.locator("#result")).toHaveText("Rows: c");
  });

  // --- edge ---

  // tapestry: an option label carrying markup is escaped, not parsed into elements
  test("escapes option labels containing markup", async ({ page }) => {
    await page.goto("/select-model");
    // The literal "<b>" is text, not a real <b> element inside the option.
    await expect(page.locator("select[name=fruit] b")).toHaveCount(0);
    await expect(page.locator("select[name=fruit] option").first()).toHaveText("Apple <b>fresh</b>");
  });

  // tapestry: a Select over an empty model renders zero options and no crash
  test("empty model renders zero options", async ({ page }) => {
    await page.goto("/select-model");
    await expect(page.locator("select[name=empty]")).toBeVisible();
    await expect(page.locator("select[name=empty] option")).toHaveCount(0);
  });

  // --- chaos ---

  // tapestry: changing the selection several times binds the LAST value at submit
  test("changing selection repeatedly binds the last value", async ({ page }) => {
    await page.goto("/select");
    const select = page.locator("select[name=rows]");
    await select.selectOption("5");
    await select.selectOption("20");
    await select.selectOption("15"); // last selection wins
    await page.locator("#submit").click();
    await expect(page).toHaveURL(/\/select-result\/15$/);
    await expect(page.locator("#result")).toHaveText("Rows: 15");
  });

  // tapestry: rendering a Select (incl. an empty model) raises no errors (fail-loud)
  test("renders without page or console errors", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") failures.push(m.text()); });
    await page.goto("/select-model");
    await expect(page.locator("select[name=fruit]")).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});

// Source: corelib/components/Select.java (blankOption / blankLabel, BlankOption enum).
// Qloom divergence: Tapestry's AUTO shows the blank when the field is not
// required, but that required-ness flows from entity bean validation (@NotNull),
// which Qloom does not port — so AUTO conservatively OMITS the blank (matching
// the required reference-app selects) and authors opt in via blankOption="always".
test.describe("Select blankOption", () => {
  // tapestry: blankOption=ALWAYS prepends an empty option carrying blankLabel
  test("ALWAYS prepends the blank option with its label", async ({ page }) => {
    await page.goto("/select-blank");
    await expect(page.locator("select[name=always] option")).toHaveText(["- pick -", "a", "b", "c"]);
  });

  // tapestry: the blank option's value is always the empty string
  test("the blank option's value is the empty string", async ({ page }) => {
    await page.goto("/select-blank");
    await expect(page.locator("select[name=always] option").first()).toHaveJSProperty("value", "");
  });

  // tapestry: "the blank option ... is never selected" — no selected attribute on it
  test("the blank option is never marked selected", async ({ page }) => {
    await page.goto("/select-blank");
    const blank = page.locator("select[name=always] option").first();
    await expect(blank).not.toHaveAttribute("selected", /.*/);
  });

  // tapestry: with no blankLabel the blank option's label is the empty string
  test("ALWAYS without blankLabel renders an empty-labelled blank", async ({ page }) => {
    await page.goto("/select-blank");
    await expect(page.locator("select[name=alwaysbare] option")).toHaveText(["", "a", "b", "c"]);
    await expect(page.locator("select[name=alwaysbare] option").first()).toHaveJSProperty("value", "");
  });

  // tapestry: blankOption=NEVER renders no blank option
  test("NEVER renders no blank option", async ({ page }) => {
    await page.goto("/select-blank");
    await expect(page.locator("select[name=never] option")).toHaveText(["a", "b", "c"]);
  });

  // Qloom divergence: AUTO (the default) omits the blank (no bean-validation signal)
  test("AUTO (default) omits the blank", async ({ page }) => {
    await page.goto("/select-blank");
    await expect(page.locator("select[name=auto] option")).toHaveText(["a", "b", "c"]);
  });

  // edge: a real value still round-trips out of an ALWAYS select (blank not chosen)
  test("selecting a real value past the blank binds that value", async ({ page }) => {
    await page.goto("/select-blank");
    await page.locator("select[name=always]").selectOption("b");
    await expect(page.locator("select[name=always]")).toHaveValue("b");
  });

  // chaos: rendering blankOption selects raises no page or console errors
  test("renders blankOption selects without page or console errors", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") failures.push(m.text()); });
    await page.goto("/select-blank");
    await expect(page.locator("select[name=always]")).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
