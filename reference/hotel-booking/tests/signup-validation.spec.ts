import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Signup — per-field client-side validation, ported faithfully from the Tapestry
 * 5.3 reference app (http://localhost:8080/tapestry5-hotel-booking/signup).
 *
 * TARGET BEHAVIOUR (observed on the live Tapestry page; Qloom reimplements it
 * natively — no Prototype/tapestry.js — per the agreed "native + replicate the
 * popup effect" parity level):
 *
 *  Field validators (blur + submit), EXACT Tapestry messages:
 *    username        required, minlength=3,  maxlength=15
 *    fullname        required, minlength=3,  maxlength=50
 *    email           required, email(format)
 *    password        required, minlength=6,  maxlength=12
 *    verifyPassword  required, minlength=6,  maxlength=12
 *    fcaptcha        required (message = the ported fcaptcha-required-message)
 *
 *  Form-level (cross-field, on submit): verifyPassword === password.
 *
 *  Error EFFECT: an invalid field's <input> gains class `t-error`; a sibling
 *  `t-error-icon` shows; a `t-error-popup` bubble carries the message. A field
 *  error blocks submission (URL stays /signup, no navigation). Form-level errors
 *  render in the `<t:errors>` block (`.t-error li`). The username field is
 *  focused on load.
 *
 * NOTE: message strings are verbatim from Tapestry (core.properties +
 * hotelBooking.properties). Selectors may be adjusted once the design spec pins
 * the exact error-decoration DOM; this suite is the behavioural baseline.
 */

// Reads the captcha answer the mock backend embeds in the SVG (a test seam, not
// a captcha bypass) — needed only for the all-valid happy path.
async function readCaptchaAnswer(page: Page): Promise<string> {
  const img = page.locator('img[alt="captcha challenge"]');
  await expect(img).toHaveAttribute("src", /^data:image\/svg/);
  const src = (await img.getAttribute("src")) ?? "";
  const svg = decodeURIComponent(src.replace(/^data:image\/svg\+xml,/, ""));
  return svg.match(/<text[^>]*>([^<]+)<\/text>/)?.[1] ?? "";
}

// Fill every field with valid values, then override specific ones per test.
async function fillValid(page: Page, over: Partial<Record<string, string>> = {}) {
  const v: Record<string, string> = {
    username: "newuser",
    fullname: "New User",
    email: "new@user.com",
    password: "secret",
    verifyPassword: "secret",
    ...over,
  };
  for (const [name, value] of Object.entries(v)) {
    await page.locator(`input[name=${name}]`).fill(value);
  }
}

const field = (name: string) => `input[name=${name}]`;

test.describe("Signup — field validation (native, Tapestry-faithful)", () => {
  test("focuses the username field on load", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator(field("username"))).toBeFocused();
  });

  test("empty submit marks every field, focuses the first invalid one, and blocks navigation", async ({
    page,
  }) => {
    await page.goto("/signup");
    await page.locator("input[type=submit]").click();

    // No navigation — submission blocked entirely on the client.
    await expect(page).toHaveURL(/\/signup$/);

    // Every field is marked invalid.
    for (const name of ["username", "fullname", "email", "password", "verifyPassword", "fcaptcha"]) {
      await expect(page.locator(field(name))).toHaveClass(/t-error/);
    }

    // Focus-only popups: the FIRST invalid field (username) is focused on
    // submit-failure, so only its popup is visible.
    await expect(page.locator(field("username"))).toBeFocused();
    await expect(
      page.locator(".t-error-popup", { hasText: "You must provide a value for Username." }),
    ).toBeVisible();

    // The other fields' messages are attached (rendered) but hidden until
    // focused — verify each by focusing it in turn.
    const rest: Record<string, string> = {
      fullname: "You must provide a value for Fullname.",
      email: "You must provide a value for Email.",
      password: "You must provide a value for Password.",
      verifyPassword: "You must provide a value for Verify Password.",
      fcaptcha: "Please fill this field with the String displayed inside the image below",
    };
    for (const [name, msg] of Object.entries(rest)) {
      await expect(page.getByText(msg, { exact: true })).toBeAttached();
      await page.locator(field(name)).focus();
      await expect(page.locator(".t-error-popup", { hasText: msg })).toBeVisible();
    }
  });

  test("username shorter than 3 characters shows the minlength message", async ({ page }) => {
    await page.goto("/signup");
    await fillValid(page, { username: "ab" });
    await page.locator("input[type=submit]").click();
    await expect(
      page.getByText("You must provide at least 3 characters for Username.", { exact: true }),
    ).toBeVisible();
    await expect(page.locator(field("username"))).toHaveClass(/t-error/);
    await expect(page).toHaveURL(/\/signup$/);
  });

  test("username longer than 15 characters shows the maxlength message", async ({ page }) => {
    await page.goto("/signup");
    await fillValid(page, { username: "a".repeat(16) });
    await page.locator("input[type=submit]").click();
    await expect(
      page.getByText("You may provide at most 15 characters for Username.", { exact: true }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/signup$/);
  });

  test("fullname respects the 3..50 length bounds", async ({ page }) => {
    await page.goto("/signup");
    await fillValid(page, { fullname: "ab" });
    await page.locator("input[type=submit]").click();
    await expect(
      page.getByText("You must provide at least 3 characters for Fullname.", { exact: true }),
    ).toBeVisible();

    await fillValid(page, { fullname: "a".repeat(51) });
    await page.locator("input[type=submit]").click();
    await expect(
      page.getByText("You may provide at most 50 characters for Fullname.", { exact: true }),
    ).toBeVisible();
  });

  test("password respects the 6..12 length bounds", async ({ page }) => {
    await page.goto("/signup");
    await fillValid(page, { password: "short", verifyPassword: "short" });
    await page.locator("input[type=submit]").click();
    await expect(
      page.getByText("You must provide at least 6 characters for Password.", { exact: true }),
    ).toBeVisible();

    await fillValid(page, { password: "a".repeat(13), verifyPassword: "a".repeat(13) });
    await page.locator("input[type=submit]").click();
    await expect(
      page.getByText("You may provide at most 12 characters for Password.", { exact: true }),
    ).toBeVisible();
  });

  test("an invalid email format shows 'Not a valid email address.'", async ({ page }) => {
    await page.goto("/signup");
    await fillValid(page, { email: "not-an-email" });
    await page.locator("input[type=submit]").click();
    await expect(page.getByText("Not a valid email address.", { exact: true })).toBeVisible();
    await expect(page.locator(field("email"))).toHaveClass(/t-error/);
    await expect(page).toHaveURL(/\/signup$/);
  });

  test("blurring an empty required field shows its error before any submit", async ({ page }) => {
    await page.goto("/signup");
    // Focus username (already focused), type nothing, blur onto fullname.
    await page.locator(field("username")).focus();
    await page.locator(field("fullname")).focus(); // blurs username — popup is
    // focus-only, so the message is now attached but not visible (fullname
    // holds focus, not username).
    await expect(
      page.getByText("You must provide a value for Username.", { exact: true }),
    ).toBeAttached();
    await expect(page.locator(field("username"))).toHaveClass(/t-error/);
  });

  test("fixing a field and blurring clears its error", async ({ page }) => {
    await page.goto("/signup");
    // Trigger an error on username via submit.
    await page.locator("input[type=submit]").click();
    await expect(page.locator(field("username"))).toHaveClass(/t-error/);

    // Enter a valid value and blur — error clears.
    await page.locator(field("username")).fill("newuser");
    await page.locator(field("fullname")).focus(); // blur username
    await expect(page.locator(field("username"))).not.toHaveClass(/t-error/);
    await expect(
      page.getByText("You must provide a value for Username.", { exact: true }),
    ).not.toBeVisible();
  });

  test("valid-length but mismatched passwords are rejected as a form error, blocked", async ({
    page,
  }) => {
    await page.goto("/signup");
    await fillValid(page, { password: "secret", verifyPassword: "sekret" });
    await page.locator("input[type=submit]").click();
    // Form-level (cross-field) errors render in the <t:errors> block.
    await expect(page.locator(".t-error li")).toContainText("Passwords are not the same");
    await expect(page).toHaveURL(/\/signup$/);
  });

  test("an invalid field renders the t-error class, error icon, and popup bubble", async ({
    page,
  }) => {
    await page.goto("/signup");
    await page.locator("input[type=submit]").click();
    // Field marked + the two decoration elements Tapestry produces.
    await expect(page.locator(field("username"))).toHaveClass(/t-error/);
    await expect(page.locator(".t-error-icon")).not.toHaveCount(0);
    await expect(
      page.locator(".t-error-popup", { hasText: "You must provide a value for Username." }),
    ).toBeVisible();
  });

  test("all valid fields plus a correct captcha proceeds to Signin", async ({ page }) => {
    await page.goto("/signup");
    const answer = await readCaptchaAnswer(page);
    await fillValid(page);
    await page.locator(field("fcaptcha")).fill(answer);
    await page.locator("input[type=submit]").click();
    await expect(page).toHaveURL(/\/signin$/);
  });
});
