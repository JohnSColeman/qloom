import { test, expect } from "@playwright/test";

// A @Parameter({ required: true }) left unbound must fail loudly at render
// (Tapestry throws at structure-assembly). The render boundary catches it and
// reports it via ErrorReporter (console.error by default) — so it surfaces, not
// silently read undefined.
test.describe("@Parameter required enforcement", () => {
  test("an unbound required parameter is reported as a named error", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });

    await page.goto("/required-param");

    await expect
      .poll(() => errors.join("\n"))
      .toContain('required parameter "label" of <needsparam> is not bound');
  });
});
