import { test, expect } from "@playwright/test";

// Source: tapestry-kaptcha/.../KaptchaIntegrationTest.java
test.describe("Kaptcha", () => {
  // tapestry: KaptchaImage renders a challenge <img>
  // (src is populated asynchronously from a captchaProvider; here we assert the
  // element is rendered — a wired provider is exercised in the skipped flow below.)
  test("KaptchaImage renders a challenge image", async ({ page }) => {
    await page.goto("/kaptcha");
    await expect(page.locator("img[alt='captcha challenge']")).toHaveCount(1);
  });

  // tapestry: KaptchaField renders the paired text input
  test("KaptchaField renders a text input", async ({ page }) => {
    await page.goto("/kaptcha");
    await expect(page.locator("input[name=fcaptcha]")).toHaveAttribute("type", "text");
  });

  // tapestry: KaptchaIntegrationTest — with a captchaProvider wired, KaptchaImage
  // fills the challenge <img> src asynchronously from the provider.
  test("KaptchaImage fills its src from the wired provider", async ({ page }) => {
    await page.goto("/kaptcha-verify");
    // the provider yields a (unique) SVG data-URI challenge image
    await expect(page.locator("img[alt='captcha challenge']")).toHaveAttribute(
      "src",
      /^data:image\/svg\+xml/,
    );
  });

  // tapestry: KaptchaIntegrationTest — a wrong answer blocks the submit and is
  // reported through <t:errors/> (Qloom verifies the challenge behind the API).
  test("a wrong answer blocks submit and shows an error", async ({ page }) => {
    await page.goto("/kaptcha-verify");
    // Wait for the challenge to be recorded (src populated) before submitting.
    await expect(page.locator("img[alt='captcha challenge']")).toHaveAttribute("src", /.+/);
    await page.locator("input[name=fcaptcha]").fill("99");
    await page.locator("#submit").click();
    await expect(page.locator(".t-error li")).toHaveText(
      "The text you typed does not match the image",
    );
    // Still on the verify page (no navigation happened).
    await expect(page.locator("img[alt='captcha challenge']")).toBeVisible();
  });

  // tapestry: KaptchaIntegrationTest — a correct answer verifies and proceeds (PRG).
  test("a correct answer verifies and proceeds", async ({ page }) => {
    await page.goto("/kaptcha-verify");
    await expect(page.locator("img[alt='captcha challenge']")).toHaveAttribute("src", /.+/);
    await page.locator("input[name=fcaptcha]").fill("42");
    await page.locator("#submit").click();
    await expect(page.locator("#verdict")).toHaveText("Verified");
  });

  // chaos — the verify page renders and submits without console/page errors.
  test("verify flow raises no errors", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/kaptcha-verify");
    await expect(page.locator("img[alt='captcha challenge']")).toHaveAttribute("src", /.+/);
    await page.locator("input[name=fcaptcha]").fill("42");
    await page.locator("#submit").click();
    await expect(page.locator("#verdict")).toHaveText("Verified");
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});

// Source: tapestry-kaptcha — the challenge image can be refreshed/regenerated.
// Qloom: clicking the KaptchaImage fetches a fresh challenge from the provider.
test.describe("Kaptcha refresh", () => {
  const img = "img[alt='captcha challenge']";

  // the image advertises that it is clickable to refresh
  test("the challenge image is a refresh control", async ({ page }) => {
    await page.goto("/kaptcha-verify");
    await expect(page.locator(img)).toHaveAttribute("title", "Click for a new challenge");
  });

  // tapestry: clicking the image regenerates the challenge — the src changes to
  // the fresh challenge the provider yields
  test("clicking the image fetches a fresh challenge", async ({ page }) => {
    await page.goto("/kaptcha-verify");
    await expect(page.locator(img)).toHaveAttribute("src", /^data:image\/svg\+xml/);
    const before = await page.locator(img).getAttribute("src");
    await page.locator(img).click();
    // a fresh, different challenge image
    await expect(page.locator(img)).not.toHaveAttribute("src", before ?? "");
    await expect(page.locator(img)).toHaveAttribute("src", /^data:image\/svg\+xml/);
  });

  // functional: after a refresh, the (new) recorded challenge still verifies a
  // correct answer — the submit uses the refreshed challenge id
  test("a correct answer still verifies after a refresh", async ({ page }) => {
    await page.goto("/kaptcha-verify");
    await expect(page.locator(img)).toHaveAttribute("src", /^data:image\/svg\+xml/);
    const before = await page.locator(img).getAttribute("src");
    await page.locator(img).click();
    await expect(page.locator(img)).not.toHaveAttribute("src", before ?? "");
    await page.locator("input[name=fcaptcha]").fill("42");
    await page.locator("#submit").click();
    await expect(page.locator("#verdict")).toHaveText("Verified");
  });

  // chaos: several refreshes in a row regenerate the challenge without errors
  test("repeated refreshes are error-free", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") failures.push(m.text()); });
    await page.goto("/kaptcha-verify");
    await expect(page.locator(img)).toHaveAttribute("src", /^data:image\/svg\+xml/);
    for (let i = 0; i < 4; i++) await page.locator(img).click();
    await expect(page.locator(img)).toHaveAttribute("src", /^data:image\/svg\+xml/);
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
