import { test, expect } from "@playwright/test";

// Source: integration/app1/AjaxTests.java#form_fragment — FormFragment.
test.describe("FormFragment", () => {
  // tapestry: AjaxTests#form_fragment — a visible fragment renders its content
  test("renders its content when visible", async ({ page }) => {
    await page.goto("/formfragment");
    await expect(page.locator("input[name=extra]")).toBeVisible();
  });

  // edge: Qloom renders the fragment body unconditionally and toggles `display`
  // (see FormFragment.ts) — a hidden fragment's field is present in the DOM but
  // not visible (so it can be revealed without a re-render).
  test("a hidden fragment renders its body but keeps it hidden", async ({ page }) => {
    await page.goto("/formfragment-hidden");
    await expect(page.locator("input[name=hiddenField]")).toBeAttached();
    await expect(page.locator("input[name=hiddenField]")).toBeHidden();
    await expect(page.locator("input[name=visibleField]")).toBeVisible();
  });

  // tapestry (AjaxTests#form_fragment): a hidden fragment's fields are EXCLUDED
  // from submit validation — filling only the visible required field lets the
  // form submit even though the hidden required field is blank.
  test("hidden-fragment fields are excluded from submit validation", async ({ page }) => {
    await page.goto("/formfragment-hidden");
    await page.locator("input[name=visibleField]").fill("here");
    await page.locator("#submit").click();
    // submission succeeds (handler navigates) — the blank hidden field did not block it
    await expect(page).toHaveURL(/\/submit-result\/here$/);
  });

  // tapestry: a hidden required field is never flagged, even when the VISIBLE
  // required field is what blocks the submit
  test("a hidden required field is never flagged as invalid", async ({ page }) => {
    await page.goto("/formfragment-hidden");
    await page.locator("#submit").click(); // both fields blank
    // only the visible field is flagged/focused; the hidden field is excluded
    await expect(page.locator("input[name=visibleField]")).toHaveClass(/t-error/);
    await expect(page.locator("input[name=hiddenField]")).not.toHaveClass(/t-error/);
    await expect(page.locator("input[name=visibleField]")).toBeFocused();
    await expect(page).toHaveURL(/\/formfragment-hidden$/);
  });

  // edge: a visible fragment's fields DO participate — the /formfragment demo has
  // a visible fragment field, so validation there is unaffected by the exclusion
  test("a visible fragment's field still participates in validation", async ({ page }) => {
    await page.goto("/formfragment");
    await expect(page.locator("input[name=extra]")).toBeVisible();
    // its enclosing fragment is visible, so it is not excluded (offsetParent set)
    await expect(page.locator("[data-form-fragment]")).toBeVisible();
  });

  // chaos: submitting the hidden-fragment form is error-free
  test("submitting with an excluded hidden field is error-free", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") failures.push(m.text()); });
    await page.goto("/formfragment-hidden");
    await page.locator("input[name=visibleField]").fill("ok");
    await page.locator("#submit").click();
    await expect(page).toHaveURL(/\/submit-result\/ok$/);
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
