import { test, expect } from "@playwright/test";

// One validation error policy for both authoring styles: an unknown validator
// throws whether it came from the @Validate annotation or t:validate markup.
// The markup path used to warn and silently install a no-op validator, leaving
// the field unvalidated. The render boundary now reports the throw via
// ErrorReporter (console.error by default).
test.describe("validation error policy", () => {
  test("an unknown t:validate validator is reported, not silently skipped", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });

    await page.goto("/unknown-validator");

    await expect.poll(() => errors.join("\n")).toContain('unknown validator "bogus"');
  });

  // The loud error is actionable — it names the offending spec and how to register
  // the validator (Validators.register / registerMacro), so the failure is not a
  // bare stack trace.
  test("the reported error is actionable (names the spec and the fix)", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });

    await page.goto("/unknown-validator");

    await expect.poll(() => errors.join("\n")).toContain('validate spec "bogus"');
    await expect.poll(() => errors.join("\n")).toContain("Validators.register");
  });
});
