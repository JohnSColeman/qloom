import { test, expect } from "@playwright/test";

// A form inside a zone that gets refreshed must keep its fields' DOM nodes (so
// uncommitted input, caret, and focus survive). The form used to be
// markForReplace'd, which swapped the whole <form> subtree wholesale on every
// refresh, wiping all of it. (We can't assert focus here because clicking the
// refresh link itself moves focus; node identity is the underlying guarantee.)
test.describe("form inside a refreshed zone", () => {
  test("a zone refresh reconciles the form in place (input + node identity kept)", async ({
    page,
  }) => {
    await page.goto("/form-in-zone");

    const input = page.locator("input[name=name]");
    await input.fill("hello");
    // Tag the live input node — a JS property survives only if the SAME node is
    // reused (not replaced), which is what preserves focus/caret/value.
    await page.evaluate(() => {
      (document.querySelector("input[name=name]") as unknown as { __tag: string }).__tag = "keep";
    });

    // External link refreshes the zone that contains the form.
    await page.locator("#refresh").click();

    // The refresh happened (display updated)…
    await expect(page.locator("#count")).toHaveText("1");
    // …and the field's node was reconciled in place: value kept, same node.
    await expect(input).toHaveValue("hello");
    const sameNode = await page.evaluate(
      () =>
        (document.querySelector("input[name=name]") as unknown as { __tag?: string }).__tag ===
        "keep",
    );
    expect(sameNode).toBe(true);
  });

  // Two refreshes in a row: the display keeps advancing (1 → 2) while the field's
  // value survives each reconcile — the form subtree is never swapped wholesale.
  test("repeated refreshes keep advancing the display and keep the field value", async ({
    page,
  }) => {
    await page.goto("/form-in-zone");
    const input = page.locator("input[name=name]");
    await input.fill("hello");

    await page.locator("#refresh").click();
    await expect(page.locator("#count")).toHaveText("1");
    await expect(input).toHaveValue("hello");

    await page.locator("#refresh").click();
    await expect(page.locator("#count")).toHaveText("2");
    await expect(input).toHaveValue("hello");
  });

  // Fail-loud: refreshing a form-bearing zone must not throw or log errors.
  test("refreshing a form-bearing zone produces no console errors", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/form-in-zone");
    await page.locator("input[name=name]").fill("hi");
    await page.locator("#refresh").click();
    await expect(page.locator("#count")).toHaveText("1");
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
