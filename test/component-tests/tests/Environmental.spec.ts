import { test, expect } from "@playwright/test";

// Ported from app1 EnvironmentalDemo (RenderableProvider / RenderableUser).
// A component pushes an ambient value onto the Environment while it renders its
// body; a nested component injects it with @Environmental — no parameter, no
// reference to the provider — and renders it. This is Tapestry's render-scoped,
// token-keyed environment stack (the anti-prop-drilling primitive).
test.describe("@Environmental (render-scoped ambient injection)", () => {
  test("a nested component injects a value pushed by an ancestor", async ({ page }) => {
    await page.goto("/environmental");
    // RenderableUser resolved the ambient Renderable and rendered its <strong>.
    await expect(page.locator("#user strong")).toHaveText(
      "A message provided by the RenderableProvider component.",
    );
    await expect(page.locator("#user")).toHaveText(
      "RenderableUser:[A message provided by the RenderableProvider component.]",
    );
  });

  test("a mixin injects the ambient value published by an ancestor it has no reference to", async ({ page }) => {
    await page.goto("/environmental");
    // The envstamp mixin reached the Renderable through the Environment — no
    // parameter, no reference to RenderableProvider — and stamped its message.
    await expect(page.locator("input[name=stamp]")).toHaveAttribute(
      "data-env",
      "A message provided by the RenderableProvider component.",
    );
  });

  test("no uncaught errors: the environmental resolves and is popped cleanly", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.goto("/environmental");
    await expect(page.locator("#user strong")).toBeVisible();
    expect(errors).toEqual([]);
  });
});
