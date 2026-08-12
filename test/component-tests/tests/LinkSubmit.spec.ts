import { test, expect } from "@playwright/test";

// Source: FormTests / ZoneTests#link_submit_inside_form_that_updates_a_zone.
test.describe("LinkSubmit", () => {
  // tapestry: LinkSubmit renders a client-side hyperlink
  test("renders a submit hyperlink", async ({ page }) => {
    await page.goto("/linksubmit");
    await expect(page.locator("#link-submit")).toBeVisible();
  });

  // tapestry: clicking the LinkSubmit submits the enclosing form (PRG)
  test("clicking the link submits the enclosing form", async ({ page }) => {
    await page.goto("/linksubmit");
    await page.locator("#link-submit").click();
    await expect(page).toHaveURL(/\/linksubmit-result\/Ada$/);
    await expect(page.locator("#result")).toHaveText("Submitted: Ada");
  });

  // --- functional -----------------------------------------------------------

  // tapestry: LinkSubmit runs the form's validation before submitting — a valid
  // field lets the submission through to the PRG target.
  test("submits a valid form to the PRG target", async ({ page }) => {
    await page.goto("/linksubmit-validate");
    await page.locator("input[name=name]").fill("Grace");
    await page.locator("#link-submit").click();
    await expect(page).toHaveURL(/\/linksubmit-result\/Grace$/);
    await expect(page.locator("#result")).toHaveText("Submitted: Grace");
  });

  // --- edge -----------------------------------------------------------------

  // tapestry: LinkSubmit submitting an invalid (empty required) form is blocked
  // by validation — no PRG happens and the offending field is flagged.
  test("blocks submission of an invalid form and flags the field", async ({ page }) => {
    await page.goto("/linksubmit-validate");
    await page.locator("#link-submit").click();
    await expect(page).toHaveURL(/\/linksubmit-validate$/);
    await expect(page.locator("input[name=name]")).toHaveClass(/t-error/);
  });

  // tapestry: after correcting the field, the same LinkSubmit now submits.
  test("submits once the invalid field is corrected", async ({ page }) => {
    await page.goto("/linksubmit-validate");
    await page.locator("#link-submit").click();
    await expect(page).toHaveURL(/\/linksubmit-validate$/);
    await page.locator("input[name=name]").fill("Ada");
    await page.locator("#link-submit").click();
    await expect(page).toHaveURL(/\/linksubmit-result\/Ada$/);
  });

  // --- chaos ----------------------------------------------------------------

  // tapestry: rapidly clicking the link twice lands on the PRG target exactly
  // once (a re-fired submit is idempotent — same route), with no runtime errors.
  test("double-clicking the link lands on the result once, fail-loud", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });

    await page.goto("/linksubmit");
    // dblclick fires two click events on the still-live link (each dispatches a
    // form submit) before the navigation re-renders the page.
    await page.locator("#link-submit").dblclick();
    await expect(page).toHaveURL(/\/linksubmit-result\/Ada$/);
    await expect(page.locator("#result")).toHaveCount(1);
    await expect(page.locator("#result")).toHaveText("Submitted: Ada");

    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
