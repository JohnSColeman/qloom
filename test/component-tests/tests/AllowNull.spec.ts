import { test, expect } from "@playwright/test";

// @Parameter({ allowNull: false }) — a *bound* parameter that resolves to null
// must fail loudly on read (Tapestry's allowNull), naming the component +
// parameter. The render boundary reports it via ErrorReporter (console.error by
// default). An unbound param, or one whose option is left default (allowNull
// true), is null-tolerant.
test.describe("@Parameter allowNull enforcement", () => {
  test("a bound allowNull=false parameter resolving to null is a named error", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });

    await page.goto("/allownull-null");

    await expect
      .poll(() => errors.join("\n"))
      .toContain('parameter "strict" of <AllowNullParam');
    await expect.poll(() => errors.join("\n")).toContain("must not be null");
  });

  test("a bound allowNull=false parameter with a non-null value renders", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });

    await page.goto("/allownull-ok");

    // strict="S" (non-null, renders) and lax bound to null (default allowNull=true,
    // reads through as ∅) — so the component renders and nothing is reported.
    await expect(page.locator("span.an")).toHaveText("S/∅");
    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);
  });

  test("the null-bound page does not render the component's normal output", async ({ page }) => {
    await page.goto("/allownull-null");
    // the read threw before the span text was produced — no successful .an render
    await expect(page.locator("span.an")).toHaveCount(0);
  });
});
