import { test, expect } from "@playwright/test";

// Regression for the "submit click cancelled by blur-time error decoration" bug
// (root cause of the Magento port's "Form flags only the first invalid field"):
// the first field is auto-focused; clicking the submit button blurs it, and its
// blur-validation inserts a block error icon that reflows the button downward, so
// a real mouse click's mouseup misses the (moved) button — the form never submits.
// The fix keeps the field focused on the submit control's mousedown, so the click
// lands and handleSubmit validates + marks EVERY field.
test.describe("submit click vs blur-time error decoration", () => {
  test("clicking submit with a focused invalid field still submits and flags every field", async ({
    page,
  }) => {
    await page.goto("/click-shift");
    // Form auto-focuses the first field on render.
    await expect(page.locator("input[name=alpha]")).toBeFocused();

    await page.locator("#go").click();

    // The discriminator: the SECOND field (never focused) only gets t-error if
    // handleSubmit actually ran — i.e. the click reached the form as a submit.
    await expect(page.locator("input[name=beta]")).toHaveClass(/t-error/);
    await expect(page.locator("input[name=alpha]")).toHaveClass(/t-error/);
  });

  // --- edge -----------------------------------------------------------------

  // When both fields are valid there is no blur-time error decoration and thus
  // no reflow — the click lands, the form validates clean, and NO field is
  // flagged (the negative of the regression above).
  test("a valid form submits without flagging any field", async ({ page }) => {
    await page.goto("/click-shift");
    await page.locator("input[name=alpha]").fill("a");
    await page.locator("input[name=beta]").fill("b");
    await page.locator("#go").click();
    await expect(page.locator("input[name=alpha]")).not.toHaveClass(/t-error/);
    await expect(page.locator("input[name=beta]")).not.toHaveClass(/t-error/);
  });

  // --- chaos ----------------------------------------------------------------

  // Double-clicking the submit control on an invalid form still flags every
  // field (the click keeps landing despite the decoration reflow) and stays
  // fail-loud.
  test("double-clicking submit on an invalid form flags every field, fail-loud", async ({
    page,
  }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });

    await page.goto("/click-shift");
    await page.locator("#go").dblclick();
    await expect(page.locator("input[name=alpha]")).toHaveClass(/t-error/);
    await expect(page.locator("input[name=beta]")).toHaveClass(/t-error/);

    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
