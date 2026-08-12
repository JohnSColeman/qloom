import { test, expect } from "@playwright/test";

// Source: corelib Form/Submit/LinkSubmit — a rapid double-click must produce
// exactly one submission (BACKLOG #7). The demo's submit handler increments a
// window/DOM counter instead of navigating, so we can count real submissions.
const submitCount = (page: import("@playwright/test").Page) =>
  page.evaluate(() => (window as unknown as { __submitCount?: number }).__submitCount ?? 0);

test.describe("double-submit guard", () => {
  // baseline: a single click submits exactly once
  test("a single click submits once", async ({ page }) => {
    await page.goto("/double-submit");
    await page.locator("#submit").click();
    await expect(page.locator("#count")).toHaveText("1");
    expect(await submitCount(page)).toBe(1);
  });

  // tapestry: double-clicking the submit button submits ONCE, not twice
  test("double-clicking the submit button submits once", async ({ page }) => {
    await page.goto("/double-submit");
    await page.locator("#submit").dblclick();
    await expect(page.locator("#count")).toHaveText("1");
    expect(await submitCount(page)).toBe(1);
  });

  // functional: a LinkSubmit (re-dispatches a submit event) submits the form
  test("a LinkSubmit click submits the form", async ({ page }) => {
    await page.goto("/double-submit");
    await page.locator("form a").click();
    await expect(page.locator("#count")).toHaveText("1");
  });

  // tapestry: two synchronous LinkSubmit clicks (a burst) still submit once —
  // the Form guard covers the re-dispatched submit path too
  test("a burst of LinkSubmit clicks submits once", async ({ page }) => {
    await page.goto("/double-submit");
    await page.evaluate(() => {
      const l = document.querySelector("form a") as HTMLElement;
      l.click();
      l.click();
    });
    await expect(page.locator("#count")).toHaveText("1");
    expect(await submitCount(page)).toBe(1);
  });

  // functional: the guard releases — a deliberate later click submits again
  test("a deliberate later submit is allowed after the guard releases", async ({ page }) => {
    await page.goto("/double-submit");
    await page.locator("#submit").dblclick();
    await expect(page.locator("#count")).toHaveText("1");
    // wait past the macrotask that clears the guard, then submit again
    await page.waitForTimeout(50);
    await page.locator("#submit").click();
    await expect(page.locator("#count")).toHaveText("2");
    expect(await submitCount(page)).toBe(2);
  });

  // chaos: a synchronous burst of button clicks still submits exactly once
  test("a synchronous burst of button clicks submits once", async ({ page }) => {
    await page.goto("/double-submit");
    await page.evaluate(() => {
      const b = document.getElementById("submit") as HTMLElement;
      b.click();
      b.click();
      b.click();
    });
    await expect(page.locator("#count")).toHaveText("1");
    expect(await submitCount(page)).toBe(1);
  });

  // chaos: double-clicking is error-free
  test("double-clicking is error-free", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") failures.push(m.text()); });
    await page.goto("/double-submit");
    await page.locator("#submit").dblclick();
    await expect(page.locator("#count")).toHaveText("1");
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
