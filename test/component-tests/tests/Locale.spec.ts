import { test, expect } from "@playwright/test";

// Runtime language switching: `${message:key}` reads the active locale; the
// LocaleSelector switches it, which persists the choice (localStorage, the
// @Persist('local') scope) and re-renders the page. Pin the browser locale so
// the initial negotiation is deterministic.
test.use({ locale: "en-US" });

const lang = 'select[aria-label="Language"]';

test.describe("locale switching", () => {
  test("defaults to English (negotiated from the browser locale)", async ({ page }) => {
    await page.goto("/locale");
    await expect(page.locator("#greeting")).toHaveText("Hello");
    await expect(page.locator("#tagline")).toHaveText("Welcome to Qloom");
    await expect(page.locator(lang)).toHaveValue("en");
  });

  test("selecting a language re-renders every message in it", async ({ page }) => {
    await page.goto("/locale");
    await page.locator(lang).selectOption("fr");
    await expect(page.locator("#greeting")).toHaveText("Bonjour");
    await expect(page.locator("#tagline")).toHaveText("Bienvenue sur Qloom");
  });

  test("the chosen language persists across reload (@Persist local)", async ({ page }) => {
    await page.goto("/locale");
    await page.locator(lang).selectOption("fr");
    await expect(page.locator("#greeting")).toHaveText("Bonjour");
    await page.reload();
    await expect(page.locator("#greeting")).toHaveText("Bonjour");
    await expect(page.locator(lang)).toHaveValue("fr"); // selector reflects the persisted locale
  });

  test("switching back to English restores the default catalogue", async ({ page }) => {
    await page.goto("/locale");
    await page.locator(lang).selectOption("fr");
    await expect(page.locator("#greeting")).toHaveText("Bonjour");
    await page.locator(lang).selectOption("en");
    await expect(page.locator("#greeting")).toHaveText("Hello");
  });

  test("a key missing in the active locale falls back to the default", async ({ page }) => {
    await page.goto("/locale");
    await expect(page.locator("#onlyen")).toHaveText("English only");
    await page.locator(lang).selectOption("fr"); // `onlyEn` has no fr translation
    await expect(page.locator("#greeting")).toHaveText("Bonjour"); // fr applied
    await expect(page.locator("#onlyen")).toHaveText("English only"); // …but this fell back to en
  });

  test("the selector labels options with each language's own name", async ({ page }) => {
    await page.goto("/locale");
    await expect(page.locator(`${lang} option`)).toHaveText(["English", "français"]);
  });

  test("switching language raises no page or console errors", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") failures.push(m.text()); });
    await page.goto("/locale");
    await page.locator(lang).selectOption("fr");
    await expect(page.locator("#greeting")).toHaveText("Bonjour");
    await page.locator(lang).selectOption("en");
    await expect(page.locator("#greeting")).toHaveText("Hello");
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
