import { test, expect } from "@playwright/test";

// @PageActivationContext two-way binds page fields to URL segments (declaration
// order), coercing to the field's default-value type, and re-synthesises the
// URL on render when the page has no onPassivate.
test.describe("@PageActivationContext", () => {
  test("populates fields from the URL context (number + string coercion)", async ({ page }) => {
    await page.goto("/pactx/42/hotel");
    await expect(page.locator("#pactx")).toHaveText("id=42 kind=hotel");
  });

  test("defaults when context segments are absent", async ({ page }) => {
    await page.goto("/pactx");
    await expect(page.locator("#pactx")).toHaveText("id=0 kind=");
  });

  test("a partial context binds present segments and defaults the rest", async ({ page }) => {
    // Only the first segment (id) is supplied; kind keeps its default ("").
    await page.goto("/pactx/9");
    await expect(page.locator("#pactx")).toHaveText("id=9 kind=");
    // …and the canonical URL drops the empty trailing segment.
    await expect(page).toHaveURL(/\/pactx\/9$/);
  });

  test("deep-linking populates the context with no console errors", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/pactx/3/villa");
    await expect(page.locator("#pactx")).toHaveText("id=3 kind=villa");
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });

  test("passivation keeps the deep-linked URL canonical (reload-safe)", async ({ page }) => {
    await page.goto("/pactx/7/resort");
    await expect(page.locator("#pactx")).toHaveText("id=7 kind=resort");
    // no onPassivate → the router rebuilds the path from the fields; URL is stable
    await expect(page).toHaveURL(/\/pactx\/7\/resort$/);
    await page.reload();
    await expect(page.locator("#pactx")).toHaveText("id=7 kind=resort");
  });
});

// The router percent-encodes each activation-context segment on the way out
// (pathFor) and decodes it on the way in (resolve), so a value with a space,
// slash, `%`, or non-ASCII character survives a deep-link + passivation
// round-trip. (BACKLOG #10.)
test.describe("@PageActivationContext percent-encoding", () => {
  // a space round-trips: %20 in the URL decodes to a literal space in the field
  test("decodes a space in a context segment", async ({ page }) => {
    await page.goto("/pactx/1/sea%20view");
    await expect(page.locator("#pactx")).toHaveText("id=1 kind=sea view");
    // passivation re-synthesises the (encoded) URL from the fields — stays encoded
    await expect(page).toHaveURL(/\/pactx\/1\/sea%20view$/);
  });

  // an encoded slash (%2F) stays a single segment rather than splitting the path
  test("an encoded slash stays within one segment", async ({ page }) => {
    await page.goto("/pactx/2/a%2Fb");
    await expect(page.locator("#pactx")).toHaveText("id=2 kind=a/b");
    await expect(page).toHaveURL(/\/pactx\/2\/a%2Fb$/);
  });

  // a percent sign round-trips (%25 → "%")
  test("decodes a percent sign", async ({ page }) => {
    await page.goto("/pactx/3/50%25off");
    await expect(page.locator("#pactx")).toHaveText("id=3 kind=50%off");
    await expect(page).toHaveURL(/\/pactx\/3\/50%25off$/);
  });

  // a non-ASCII value round-trips (é → %C3%A9)
  test("decodes a non-ASCII segment", async ({ page }) => {
    await page.goto("/pactx/4/caf%C3%A9");
    await expect(page.locator("#pactx")).toHaveText("id=4 kind=café");
    await expect(page).toHaveURL(/\/pactx\/4\/caf%C3%A9$/);
  });

  // chaos: a reload after a special-char deep-link is reload-safe and error-free
  test("special-char context is reload-safe and error-free", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") failures.push(m.text()); });
    await page.goto("/pactx/5/two%20words");
    await expect(page.locator("#pactx")).toHaveText("id=5 kind=two words");
    await page.reload();
    await expect(page.locator("#pactx")).toHaveText("id=5 kind=two words");
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
