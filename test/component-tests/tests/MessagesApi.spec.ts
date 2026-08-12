import { test, expect } from "@playwright/test";

// Messages from a backend provider: a provider-only locale is lazy-loaded on
// switch; a persisted provider-only locale is re-fetched on cold load; and
// `reload()` re-fetches live (a CMS-style override). Bundled `.properties` are
// the baseline the API augments/overrides. Pin the browser locale.
test.use({ locale: "en-US" });

const lang = 'select[aria-label="Language"]';

test.describe("messages provider (API)", () => {
  test("the selector offers announced locales even when not bundled", async ({ page }) => {
    await page.goto("/messages-api");
    await expect(page.locator("#ma-h")).toHaveText("Messages API demo"); // bundled
    await expect(page.locator(`${lang} option`)).toHaveText(["English", "Deutsch"]);
  });

  test("lazy-loads a provider-only locale on switch", async ({ page }) => {
    await page.goto("/messages-api");
    // apiGreeting isn't bundled → the raw key until something supplies it
    await expect(page.locator("#apigreeting")).toHaveText("apiGreeting");
    await page.locator(lang).selectOption("de"); // `de` is provider-only
    await expect(page.locator("#apigreeting")).toHaveText("Aus der API"); // fetched
  });

  test("reload() re-fetches the catalogue live (CMS override)", async ({ page }) => {
    await page.goto("/messages-api");
    await expect(page.locator("#apigreeting")).toHaveText("apiGreeting");
    await page.getByText("Reload messages").click();
    await expect(page.locator("#apigreeting")).toHaveText("API call 1");
    await page.getByText("Reload messages").click();
    await expect(page.locator("#apigreeting")).toHaveText("API call 2"); // each reload re-fetches
  });

  test("a persisted provider-only locale is re-fetched on cold load", async ({ page }) => {
    await page.goto("/messages-api");
    await page.locator(lang).selectOption("de");
    await expect(page.locator("#apigreeting")).toHaveText("Aus der API");
    await page.reload(); // `de` is not bundled — gone from the fresh module
    await expect(page.locator("#apigreeting")).toHaveText("Aus der API"); // Router re-fetched it
    await expect(page.locator(lang)).toHaveValue("de");
  });

  test("provider-driven messages raise no page or console errors", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") failures.push(m.text()); });
    await page.goto("/messages-api");
    await page.locator(lang).selectOption("de");
    await expect(page.locator("#apigreeting")).toHaveText("Aus der API");
    await page.getByText("Reload messages").click();
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
