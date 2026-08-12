import { test, expect } from "@playwright/test";

// Source: component reference — Trigger.
test.describe("Trigger", () => {
  // tapestry: Trigger fires an event during rendering; the handler injects content
  test("fires an event during rendering that can inject content", async ({ page }) => {
    await page.goto("/trigger");
    await expect(page.locator("#decorated")).toHaveText("decorated by trigger");
  });

  // edge: with no event parameter, Trigger fires the default "action" event
  test("fires the default action event when event is unbound", async ({ page }) => {
    await page.goto("/trigger");
    await expect(page.locator("#default-wrap #default-fired")).toHaveText("action fired");
  });

  // edge: an event with no matching handler renders nothing and does not crash
  test("renders nothing when no handler matches the event", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/trigger");
    await expect(page.locator("#unhandled-wrap")).toHaveText("");
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
