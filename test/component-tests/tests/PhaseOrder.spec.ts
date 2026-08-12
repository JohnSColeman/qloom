import { test, expect } from "@playwright/test";

// The full Tapestry render-phase order, including the two template phases:
// setup → begin → beforeTemplate → [beforeBody → body → afterBody] → afterTemplate
// → afterRender → cleanup. The body phases nest inside the template phases.
test.describe("render phases", () => {
  test("beforeRenderTemplate / afterRenderTemplate fire in Tapestry order", async ({ page }) => {
    await page.goto("/phase-order");
    await expect(page.locator("#order")).toHaveText(
      "setup,begin,beforeTemplate,beforeBody,afterBody,afterTemplate,afterRender,cleanup",
    );
  });

  // A single render pass fires each phase exactly once — a duplicated phase
  // (double render, or the state machine re-entering) would repeat a name.
  test("each render phase fires exactly once for a single render", async ({ page }) => {
    await page.goto("/phase-order");
    const order = (await page.locator("#order").textContent())?.split(",") ?? [];
    const counts = order.reduce<Record<string, number>>((acc, name) => {
      acc[name] = (acc[name] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({
      setup: 1,
      begin: 1,
      beforeTemplate: 1,
      beforeBody: 1,
      afterBody: 1,
      afterTemplate: 1,
      afterRender: 1,
      cleanup: 1,
    });
  });

  // Fail-loud: the phase recorder renders cleanly.
  test("the phase-order page renders with no console errors", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/phase-order");
    await expect(page.locator("#order")).toContainText("cleanup");
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
