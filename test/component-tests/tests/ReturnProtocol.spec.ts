import { test, expect } from "@playwright/test";

// Mixins participate fully in Tapestry's render return-value protocol — not just
// `false`. Rule (RenderPhaseEventHandler.handleResult): the first participant
// (before-mixins → host → after-mixins) to return a boolean aborts the rest, and
// that boolean is the phase result; a void/null return continues; if none returns
// a boolean the result is `true`.
test.describe("mixin return-value protocol (beyond `false`)", () => {
  test("a mixin's `true` from beforeRenderBody overrides the host's `false`", async ({ page }) => {
    await page.goto("/return-protocol");
    // host returns false → its body is skipped
    await expect(page.locator("#plain")).toHaveText("");
    // the forcebody mixin returns true first → aborts the host's false → body renders
    await expect(page.locator("#forced")).toHaveText("BODY");
  });

  test("a mixin drives the render loop via `false` from afterRender", async ({ page }) => {
    await page.goto("/return-protocol");
    // repeatonce returns false once → the host's beginRender runs twice
    const reps = page.locator("#loop .rep");
    await expect(reps).toHaveCount(2);
    await expect(reps.nth(0)).toHaveText("1");
    await expect(reps.nth(1)).toHaveText("2");
  });
});
