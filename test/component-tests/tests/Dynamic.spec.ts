import { test, expect } from "@playwright/test";

// Source: component reference — Dynamic renders an external template's content.
test.describe("Dynamic", () => {
  // tapestry: Dynamic renders the referenced template's body into the host
  test("renders the external template body", async ({ page }) => {
    await page.goto("/dynamic");
    await expect(page.locator("#dyn")).toHaveText("dynamic body");
  });

  // edge: the template body is materialised as real DOM inside the host div
  test("materialises the template as real DOM inside the host", async ({ page }) => {
    await page.goto("/dynamic");
    await expect(page.locator("div#host > #dyn")).toHaveText("dynamic body");
  });

  // edge: an unbound template renders an empty host div, without crashing
  test("renders an empty div when template is unbound", async ({ page }) => {
    await page.goto("/dynamic");
    await expect(page.locator("div#empty-host")).toHaveText("");
  });

  // functional: rich markup materialises multiple child nodes
  test("renders multiple nodes from rich markup", async ({ page }) => {
    await page.goto("/dynamic");
    await expect(page.locator("#rich-host .ri")).toHaveCount(2);
    await expect(page.locator("#rich-host .ri").first()).toHaveText("a");
    await expect(page.locator("#rich-host .ri").last()).toHaveText("b");
  });

  // chaos: a <script> in the template must not execute; inert siblings still
  // render and no error surfaces (writer.raw clones template content inertly).
  test("does not execute injected script markup", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/dynamic");
    await expect(page.locator("#hostile-host #safe")).toHaveText("ok");
    const pwned = await page.evaluate(
      () => (window as unknown as { __pwned?: boolean }).__pwned,
    );
    expect(pwned).toBeUndefined();
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
