import { test, expect } from "@playwright/test";

// Source: integration/app1/FormTests.java#server_side_validation_for_textfield_and_textarea
test.describe("TextField", () => {
  // tapestry: FormTests — TextField renders an <input type="text">
  test("renders an input[type=text]", async ({ page }) => {
    await page.goto("/textfield");
    await expect(page.locator("input[name=name]")).toHaveAttribute("type", "text");
  });

  // tapestry: FormTests#server_side_validation_for_textfield_and_textarea (required)
  // Field errors surface via the native error-popup effect (t-error/t-error-popup),
  // not the Errors summary — Errors lists only unassociated errors.
  test("required validation blocks submit and reports the field", async ({ page }) => {
    await page.goto("/textfield");
    await page.locator("#submit").click();
    await expect(page.locator("input[name=name]")).toHaveClass(/t-error/);
    await expect(
      page.locator(".t-error-popup", { hasText: "You must provide a value for Name." }),
    ).toBeVisible();
    await expect(page.locator("#result")).toHaveCount(0);
  });

  // tapestry: FormTests#server_side_validation_for_textfield_and_textarea (two-way bind, PRG)
  test("valid submit two-way binds the value (PRG)", async ({ page }) => {
    await page.goto("/textfield");
    await page.locator("input[name=name]").fill("Ada");
    await page.locator("#submit").click();
    await expect(page).toHaveURL(/\/textfield-result\/Ada$/);
    await expect(page.locator("#result")).toHaveText("Name: Ada");
  });

  // --- functional -------------------------------------------------------------

  // tapestry: a value with safe punctuation round-trips through the PRG context
  test("round-trips a punctuated value through submit", async ({ page }) => {
    await page.goto("/textfield");
    await page.locator("input[name=name]").fill("Ada-99");
    await page.locator("#submit").click();
    await expect(page).toHaveURL(/\/textfield-result\/Ada-99$/);
    await expect(page.locator("#result")).toHaveText("Name: Ada-99");
  });

  // tapestry: a fresh page instance validates independently — two valid submits
  test("supports multiple independent valid submits", async ({ page }) => {
    await page.goto("/textfield");
    await page.locator("input[name=name]").fill("Ada");
    await page.locator("#submit").click();
    await expect(page.locator("#result")).toHaveText("Name: Ada");

    await page.goto("/textfield");
    await page.locator("input[name=name]").fill("Bob");
    await page.locator("#submit").click();
    await expect(page.locator("#result")).toHaveText("Name: Bob");
  });

  // tapestry: minlength/maxlength on a TextField (FormTests length validators)
  test("minlength permits an empty (non-required) value", async ({ page }) => {
    // minlength owns only non-empty length; blankness belongs to `required`.
    await page.goto("/textfield-validate");
    await page.locator("#submit").click();
    await expect(page).toHaveURL(/\/textfield-result\/?$/);
  });

  test("minlength boundary value submits (PRG)", async ({ page }) => {
    await page.goto("/textfield-validate");
    await page.locator("input[name=code]").fill("abcdef"); // len 6 == maxlength
    await page.locator("#submit").click();
    await expect(page).toHaveURL(/\/textfield-result\/abcdef$/);
  });

  // tapestry: informal placeholder passes through to the rendered <input>
  test("passes an informal placeholder attribute through", async ({ page }) => {
    await page.goto("/textfield-validate");
    await expect(page.locator("input[name=code]")).toHaveAttribute("placeholder", "3 to 6");
  });

  // tapestry: informal disabled attribute passes through
  test("passes a disabled attribute through", async ({ page }) => {
    await page.goto("/textfield-validate");
    await expect(page.locator("input[name=nick]")).toBeDisabled();
  });

  // tapestry: a bound property pre-fills the input value on first render
  test("renders a pre-filled property value", async ({ page }) => {
    await page.goto("/textfield-validate");
    await expect(page.locator("input[name=nick]")).toHaveValue("locked");
  });

  // tapestry: a label wrapping the field associates implicitly (click focuses it)
  test("implicit label association focuses the field", async ({ page }) => {
    await page.goto("/textfield-validate");
    await page.locator("#code-text").click();
    await expect(page.locator("input[name=code]")).toBeFocused();
  });

  // --- edge --------------------------------------------------------------------

  // tapestry: required treats whitespace-only as blank (Composite `.trim()`)
  test("required rejects a whitespace-only value", async ({ page }) => {
    await page.goto("/textfield");
    await page.locator("input[name=name]").fill("   ");
    await page.locator("#submit").click();
    await expect(page.locator("input[name=name]")).toHaveClass(/t-error/);
    await expect(page).toHaveURL(/\/textfield$/);
  });

  test("minlength below the bound blocks with its message", async ({ page }) => {
    await page.goto("/textfield-validate");
    await page.locator("input[name=code]").fill("ab"); // len 2 < 3
    await page.locator("#submit").click();
    await expect(page.locator("input[name=code]")).toHaveClass(/t-error/);
    await expect(
      page.locator(".t-error-popup", {
        hasText: "You must provide at least 3 characters for Code.",
      }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/textfield-validate$/);
  });

  test("maxlength above the bound blocks with its message", async ({ page }) => {
    await page.goto("/textfield-validate");
    await page.locator("input[name=code]").fill("abcdefg"); // len 7 > 6
    await page.locator("#submit").click();
    await expect(page.locator("input[name=code]")).toHaveClass(/t-error/);
    await expect(
      page.locator(".t-error-popup", {
        hasText: "You may provide at most 6 characters for Code.",
      }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/textfield-validate$/);
  });

  // tapestry: an HTML/quote-bearing value is set via setAttribute — inert, escaped
  test("renders an HTML-bearing value without injection", async ({ page }) => {
    await page.goto("/textfield-validate");
    await expect(page.locator("input[name=raw]")).toHaveValue('<b>x</b> & "q"');
    await expect(page.locator("form b")).toHaveCount(0);
  });

  // tapestry: correcting a rejected field and re-submitting clears the decoration
  test("re-submit after correcting the value clears the error", async ({ page }) => {
    await page.goto("/textfield");
    await page.locator("#submit").click();
    await expect(page.locator("input[name=name]")).toHaveClass(/t-error/);
    await page.locator("input[name=name]").fill("Ada");
    await page.locator("#submit").click();
    await expect(page.locator("#result")).toHaveText("Name: Ada");
  });

  // --- chaos -------------------------------------------------------------------

  // tapestry: repeated blocked submits + a fill→clear→submit stay inert (fail-loud)
  test("survives repeated and fill/clear submits with no console errors", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/textfield");
    const input = page.locator("input[name=name]");
    await page.locator("#submit").click();
    await page.locator("#submit").click();
    await input.fill("temp");
    await input.fill("");
    await page.locator("#submit").click();
    await expect(input).toHaveClass(/t-error/);
    await expect(page).toHaveURL(/\/textfield$/);
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });

  // tapestry: rapid typing then a valid submit produces no console errors
  test("survives rapid typing then a valid submit (fail-loud)", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/textfield");
    const input = page.locator("input[name=name]");
    await input.pressSequentially("Grace Hopper", { delay: 5 });
    await input.fill("Grace");
    await page.locator("#submit").click();
    await expect(page.locator("#result")).toHaveText("Name: Grace");
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
