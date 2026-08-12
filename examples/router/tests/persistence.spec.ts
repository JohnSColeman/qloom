import { test, expect } from "@playwright/test";

/**
 * The persistence decorators, exercised on the Home page:
 *   - @Persist('local')  — survives reload, encrypted at rest.
 *   - @Persist('flash')  — readable for one activation, then discarded.
 *   - @SessionState(create:false) — not created until set; `<name>Exists` companion.
 */
test.describe("persistence — @Persist scopes + @SessionState create", () => {
  test("@Persist('local') survives reload and is encrypted at rest", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#visits")).toHaveText("1");
    // wait for the debounced encrypted flush before reloading
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("qloom:persist:local")))
      .not.toBeNull();

    await page.reload();
    await expect(page.locator("#visits")).toHaveText("2"); // restored, then incremented

    const raw = await page.evaluate(() => localStorage.getItem("qloom:persist:local"));
    expect(raw).not.toContain("visits"); // encrypted — no plaintext field name
    expect(raw).toMatch(/^[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+$/); // iv.ciphertext
  });

  test("@Persist('flash') is readable for one activation, then discarded", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#flash")).toHaveText("");

    await page.locator("#notify").click(); // sets flash + redirects to self
    await expect(page.locator("#flash")).toHaveText("flashed"); // one activation later: readable

    await page.locator("#home-again").click(); // another activation
    await expect(page.locator("#flash")).toHaveText(""); // discarded
  });

  test("@SessionState({ create: false }) is not created until set; Exists reflects it", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#demo-exists")).toHaveText("false"); // accessing it didn't create it

    await page.locator("#create-demo").click();
    await expect(page.locator("#demo-exists")).toHaveText("true"); // now it exists
  });
});
