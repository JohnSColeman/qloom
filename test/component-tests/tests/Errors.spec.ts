import { test, expect } from "@playwright/test";

// Source: integration/app1/FormTests.java — Errors presents form validation errors
test.describe("Errors", () => {
  // tapestry: no errors are shown before submission
  test("shows no errors before submission", async ({ page }) => {
    await page.goto("/errors");
    await expect(page.locator(".t-error li")).toHaveCount(0);
  });

  // tapestry: an invalid submit marks every field; field errors surface via the
  // native error-popup effect (t-error/t-error-popup), not the Errors summary —
  // Errors now lists only unassociated (cross-field/handler) errors.
  test("lists every field error after an invalid submit", async ({ page }) => {
    await page.goto("/errors");
    await page.locator("#submit").click();
    for (const n of ["name", "email"]) {
      await expect(page.locator(`input[name=${n}]`)).toHaveClass(/t-error/);
    }
    await expect(page.locator("input[name=name]")).toBeFocused();
    await expect(
      page.locator(".t-error-popup", { hasText: "You must provide a value for Name." }),
    ).toBeVisible();
  });

  // edge: the container renders before submit (a stable target for the in-place
  // patch) but with no banner/list until an unassociated error is recorded.
  test("the .t-error container renders empty before submit", async ({ page }) => {
    await page.goto("/errors");
    await expect(page.locator(".t-error")).toBeAttached();
    await expect(page.locator(".t-error > .t-banner")).toHaveCount(0);
    await expect(page.locator(".t-error li")).toHaveCount(0);
  });

  // edge: field-associated errors surface as popups only — the summary lists just
  // UNASSOCIATED errors, so a form whose only errors are field-level keeps an
  // empty summary even after an invalid submit.
  test("summary stays empty when only field-associated errors exist", async ({ page }) => {
    await page.goto("/errors");
    await page.locator("#submit").click();
    await expect(page.locator("input[name=name]")).toHaveClass(/t-error/);
    await expect(page.locator(".t-error > .t-banner")).toHaveCount(0);
    await expect(page.locator(".t-error li")).toHaveCount(0);
  });

  // chaos: repeated invalid submits must not stack/duplicate summary entries —
  // handleSubmit resets the recorded errors each pass.
  test("repeated invalid submits keep the summary empty (no stacking)", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/errors");
    await page.locator("#submit").click();
    await page.locator("#submit").click();
    await page.locator("#submit").click();
    await expect(page.locator(".t-error li")).toHaveCount(0);
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
