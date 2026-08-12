import { test, expect } from "@playwright/test";

// Source: integration/app1/FormTests.java — TextArea.
test.describe("TextArea", () => {
  // tapestry: TextArea renders a <textarea>
  test("renders a textarea", async ({ page }) => {
    await page.goto("/textarea");
    await expect(page.locator("textarea[name=message]")).toBeVisible();
  });

  // tapestry: TextArea two-way binds multi-line text on submit (PRG)
  test("two-way binds the value on submit", async ({ page }) => {
    await page.goto("/textarea");
    await page.locator("textarea[name=message]").fill("hello world");
    await page.locator("#submit").click();
    await expect(page.locator("#result")).toHaveText("Message: hello world");
  });

  // --- functional -------------------------------------------------------------

  // tapestry: a bound property pre-fills the textarea's text content on render
  test("renders a pre-filled property value", async ({ page }) => {
    await page.goto("/textarea-validate");
    await expect(page.locator("textarea[name=note]")).toHaveValue("<i>x</i>");
  });

  // tapestry: informal placeholder passes through to the <textarea>
  test("passes an informal placeholder attribute through", async ({ page }) => {
    await page.goto("/textarea-validate");
    await expect(page.locator("textarea[name=bio]")).toHaveAttribute("placeholder", "min 5");
  });

  // tapestry: minlength boundary value submits (PRG)
  test("minlength boundary value submits (PRG)", async ({ page }) => {
    await page.goto("/textarea-validate");
    await page.locator("textarea[name=bio]").fill("hello"); // len 5 == minlength
    await page.locator("#submit").click();
    await expect(page.locator("#result")).toHaveText("Message: hello");
  });

  // --- edge --------------------------------------------------------------------

  // tapestry: required TextArea blocks an empty submit, decorates with t-error
  test("required rejects an empty textarea", async ({ page }) => {
    await page.goto("/textarea-validate");
    await page.locator("#submit").click();
    await expect(page.locator("textarea[name=bio]")).toHaveClass(/t-error/);
    await expect(
      page.locator(".t-error-popup", { hasText: "You must provide a value for Bio." }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/textarea-validate$/);
  });

  // tapestry: whitespace-only fails required (trim)
  test("required rejects a whitespace-only textarea", async ({ page }) => {
    await page.goto("/textarea-validate");
    await page.locator("textarea[name=bio]").fill("   ");
    await page.locator("#submit").click();
    await expect(page.locator("textarea[name=bio]")).toHaveClass(/t-error/);
    await expect(page).toHaveURL(/\/textarea-validate$/);
  });

  // tapestry: a too-short value blocks with the minlength message
  test("minlength below the bound blocks with its message", async ({ page }) => {
    await page.goto("/textarea-validate");
    await page.locator("textarea[name=bio]").fill("abc"); // len 3 < 5
    await page.locator("#submit").click();
    await expect(
      page.locator(".t-error-popup", {
        hasText: "You must provide at least 5 characters for Bio.",
      }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/textarea-validate$/);
  });

  // tapestry: an HTML-bearing value renders as inert text content (no injection)
  test("renders an HTML-bearing value without injection", async ({ page }) => {
    await page.goto("/textarea-validate");
    await expect(page.locator("textarea[name=note]")).toHaveValue("<i>x</i>");
    await expect(page.locator("form i")).toHaveCount(0);
  });

  // --- chaos -------------------------------------------------------------------

  // tapestry: correcting a rejected textarea and re-submitting clears the error
  test("re-submit after correcting clears the error (fail-loud)", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/textarea-validate");
    await page.locator("#submit").click();
    await expect(page.locator("textarea[name=bio]")).toHaveClass(/t-error/);
    await page.locator("textarea[name=bio]").fill("hello world");
    await page.locator("#submit").click();
    await expect(page.locator("#result")).toHaveText("Message: hello world");
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
