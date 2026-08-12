import { test, expect } from "@playwright/test";

// Field-level validation: @Validate on page props, blur + submit, native effect.
test.describe("@Validate field validation", () => {
  test("empty submit marks every field and blocks", async ({ page }) => {
    await page.goto("/validation");
    await page.locator("input[type=submit]").click();
    for (const m of [
      "You must provide a value for Username.",
      "You must provide a value for Email.",
      "You must provide a value for Password.",
    ]) {
      await expect(page.getByText(m, { exact: true })).toBeAttached();
    }
    for (const n of ["username", "email", "password"]) {
      await expect(page.locator(`input[name=${n}]`)).toHaveClass(/t-error/);
    }
  });

  test("minlength / maxlength / email messages", async ({ page }) => {
    await page.goto("/validation");
    await page.locator("input[name=username]").fill("ab");
    await page.locator("input[name=email]").fill("x@y.z");
    await page.locator("input[name=password]").fill("secret");
    await page.locator("input[type=submit]").click();
    await expect(
      page.getByText("You must provide at least 3 characters for Username.", { exact: true }),
    ).toBeAttached();

    await page.locator("input[name=username]").fill("a".repeat(16));
    await page.locator("input[type=submit]").click();
    await expect(
      page.getByText("You may provide at most 15 characters for Username.", { exact: true }),
    ).toBeAttached();

    await page.locator("input[name=username]").fill("valid");
    await page.locator("input[name=email]").fill("not-email");
    await page.locator("input[type=submit]").click();
    await expect(page.getByText("Not a valid email address.", { exact: true })).toBeAttached();
  });

  test("blur validates a single field; fixing + blur clears it", async ({ page }) => {
    await page.goto("/validation");
    await page.locator("input[name=username]").focus();
    await page.locator("input[name=email]").focus(); // blur username (empty)
    await expect(page.locator("input[name=username]")).toHaveClass(/t-error/);
    await page.locator("input[name=username]").fill("valid");
    await page.locator("input[name=password]").focus(); // blur username (now valid)
    await expect(page.locator("input[name=username]")).not.toHaveClass(/t-error/);
  });

  test("focus-only popup + first-error focus on submit", async ({ page }) => {
    await page.goto("/validation");
    await page.locator("input[type=submit]").click();
    // First invalid field (username) is focused, so its popup is visible.
    await expect(page.locator("input[name=username]")).toBeFocused();
    await expect(
      page.locator(".t-error-popup", { hasText: "You must provide a value for Username." }),
    ).toBeVisible();
    // The email popup exists but is hidden until email is focused.
    await page.locator("input[name=email]").focus();
    await expect(
      page.locator(".t-error-popup", { hasText: "You must provide a value for Email." }),
    ).toBeVisible();
  });

  test("popup is positioned above the field and its ✕ dismisses it", async ({ page }) => {
    await page.goto("/validation");
    await page.locator("input[type=submit]").click();
    await page.locator("input[name=username]").focus();
    const popup = page.locator(".t-error-popup", {
      hasText: "You must provide a value for Username.",
    });
    await expect(popup).toBeVisible();

    // The bubble sits above the input (its bottom edge is at or above the input's top).
    const inputBox = await page.locator("input[name=username]").boundingBox();
    const popupBox = await popup.boundingBox();
    expect(popupBox!.y + popupBox!.height).toBeLessThanOrEqual(inputBox!.y + 1);

    // The ✕ close control hides the bubble (without unmarking the field).
    await expect(popup.locator(".t-error-popup-close")).toHaveText("✕");
    await popup.locator(".t-error-popup-close").click();
    await expect(popup).toBeHidden();
    await expect(page.locator("input[name=username]")).toHaveClass(/t-error/);
  });

  test("all valid submits (fires the submit handler → result route)", async ({ page }) => {
    await page.goto("/validation");
    await page.locator("input[name=username]").fill("validname");
    await page.locator("input[name=email]").fill("a@b.com");
    await page.locator("input[name=password]").fill("secret");
    await page.locator("input[name=verify]").fill("secret");
    await page.locator("textarea[name=bio]").fill("Just a test bio.");
    await page.locator("input[type=submit]").click();
    await expect(page.locator("#done")).toHaveText("ok");
  });

  test("TextArea validation errors are decorated like Field (regression)", async ({ page }) => {
    await page.goto("/validation");
    await page.locator("input[type=submit]").click();
    await expect(page.locator("textarea[name=bio]")).toHaveClass(/t-error/);
    await page.locator("textarea[name=bio]").focus();
    await expect(
      page.locator(".t-error-popup", { hasText: "You must provide a value for Bio." }),
    ).toBeVisible();
  });

  test("cross-field VALIDATE error renders in the summary and blocks", async ({ page }) => {
    await page.goto("/validation");
    await page.locator("input[name=username]").fill("validname");
    await page.locator("input[name=email]").fill("a@b.com");
    await page.locator("input[name=password]").fill("secret");
    await page.locator("input[name=verify]").fill("sekret");
    await page.locator("input[type=submit]").click();
    await expect(page.locator(".t-error li")).toContainText("Passwords are not the same");
    // Tapestry's Errors summary renders the banner header (DIV.t-error > DIV.t-banner) —
    // the element the app stylesheet paints as the red box (DIV.t-error DIV).
    await expect(page.locator(".t-error > .t-banner")).toHaveText(
      "You must correct the following errors before continuing.",
    );
    await expect(page.locator("#done")).toHaveText(""); // submit handler did NOT run
  });

  // functional: Composite runs rules left-to-right and reports the FIRST failure —
  // an empty username fails `required` before `minlength`, so only the required
  // message shows (not "at least 3 characters").
  test("Composite reports the first failing rule (required before minlength)", async ({ page }) => {
    await page.goto("/validation");
    await page.locator("input[type=submit]").click();
    await expect(
      page.getByText("You must provide a value for Username.", { exact: true }),
    ).toBeAttached();
    await expect(
      page.getByText("You must provide at least 3 characters for Username.", { exact: true }),
    ).toHaveCount(0);
  });

  // functional: several invalid fields → the FIRST is focused and EVERY invalid
  // field is decorated (not just the focused one).
  test("multiple invalid fields: first focused, all decorated", async ({ page }) => {
    await page.goto("/validation");
    await page.locator("input[type=submit]").click();
    await expect(page.locator("input[name=username]")).toBeFocused();
    for (const n of ["username", "email", "password", "verify"]) {
      await expect(page.locator(`input[name=${n}]`)).toHaveClass(/t-error/);
    }
    await expect(page.locator("textarea[name=bio]")).toHaveClass(/t-error/);
  });

  // functional: correcting one field and resubmitting advances past it — the fixed
  // field loses its decoration while the still-invalid ones keep theirs.
  test("correcting one field then resubmit clears only that field", async ({ page }) => {
    await page.goto("/validation");
    await page.locator("input[type=submit]").click();
    await expect(page.locator("input[name=username]")).toHaveClass(/t-error/);
    await page.locator("input[name=username]").fill("validname");
    await page.locator("input[type=submit]").click();
    await expect(page.locator("input[name=username]")).not.toHaveClass(/t-error/);
    await expect(page.locator("input[name=email]")).toHaveClass(/t-error/);
  });

  // edge: minlength/maxlength boundaries are inclusive — username of exactly 3 and
  // exactly 15 characters both pass (with the other fields valid the form submits).
  test("minlength / maxlength boundaries are inclusive", async ({ page }) => {
    await page.goto("/validation");
    await page.locator("input[name=email]").fill("a@b.com");
    await page.locator("input[name=password]").fill("secret");
    await page.locator("input[name=verify]").fill("secret");
    await page.locator("textarea[name=bio]").fill("bio");
    await page.locator("input[name=username]").fill("abc"); // exactly 3
    await page.locator("input[type=submit]").click();
    await expect(page.locator("#done")).toHaveText("ok");

    await page.locator("input[name=username]").fill("a".repeat(15)); // exactly 15
    await page.locator("input[type=submit]").click();
    await expect(page.locator("input[name=username]")).not.toHaveClass(/t-error/);
  });

  // chaos: repeated cross-field invalid submits must not duplicate the summary
  // entry — the recorded errors reset each submit, so exactly one <li> remains.
  test("repeated cross-field failures do not stack in the summary", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/validation");
    await page.locator("input[name=username]").fill("validname");
    await page.locator("input[name=email]").fill("a@b.com");
    await page.locator("input[name=password]").fill("secret");
    await page.locator("input[name=verify]").fill("sekret");
    await page.locator("textarea[name=bio]").fill("bio");
    await page.locator("input[type=submit]").click();
    await page.locator("input[type=submit]").click();
    await expect(page.locator(".t-error li")).toHaveCount(1);
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });

  // chaos: fill → clear → submit re-flags the field (a stale "valid" state is not
  // cached; the current input value is re-validated on every submit).
  test("fill then clear then submit re-flags the field", async ({ page }) => {
    await page.goto("/validation");
    await page.locator("input[name=username]").fill("validname");
    await page.locator("input[name=username]").fill("");
    await page.locator("input[type=submit]").click();
    await expect(page.locator("input[name=username]")).toHaveClass(/t-error/);
    await expect(
      page.getByText("You must provide a value for Username.", { exact: true }),
    ).toBeAttached();
  });
});
