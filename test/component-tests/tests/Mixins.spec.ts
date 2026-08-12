import { test, expect } from "@playwright/test";

// Ported from tapestry-core app1: Confirm mixin (ConfirmMixinTests.groovy) and
// DiscardBody (DupeMixinDemo.tml). A mixin attaches to a host component and
// interleaves with its render phases (before/after via @MixinAfter).
test.describe("Confirm mixin (@MixinAfter, writes attributes)", () => {
  // tapestry: the mixin runs after the host and adds data-confirm-* to its element
  test("writes data-confirm-* attributes onto the host element", async ({ page }) => {
    await page.goto("/confirm-mixin");
    const link = page.getByText("Click This");
    await expect(link).toHaveAttribute("data-confirm-message", "Really do this?");
  });

  // tapestry: confirming the dialog proceeds with the action (the ActionLink fires)
  test("confirming the dialog proceeds with the action", async ({ page }) => {
    await page.goto("/confirm-mixin");
    page.once("dialog", (d) => d.accept());
    await page.getByText("Click This").click();
    await expect(page).toHaveURL(/\/confirm-result$/);
    await expect(page.locator("#result")).toHaveText("Confirmed");
  });

  // tapestry: cancelling the dialog aborts the action (stays put)
  test("cancelling the dialog aborts the action", async ({ page }) => {
    await page.goto("/confirm-mixin");
    page.once("dialog", (d) => d.dismiss());
    await page.getByText("Click This").click();
    await page.waitForTimeout(200);
    await expect(page).toHaveURL(/\/confirm-mixin$/);
  });
});

test.describe("DiscardBody mixin (@MixinAfter, suppresses the body)", () => {
  // tapestry: DiscardBody's beforeRenderBody returns false → the host's body is dropped
  test("discards the host component's body", async ({ page }) => {
    await page.goto("/discardbody");
    const el = page.locator("article");
    await expect(el).toBeAttached(); // the element still renders...
    await expect(el).toHaveText(""); // ...but its body is discarded (empty → zero-size)
  });
});

// Ported from app1 (RenderDisabled). The mixin reaches its host component via
// @InjectContainer and reads the host field's `disabled` to render the attribute.
// The demo template carries NO t:mixins — every field auto-applies it via
// @Mixin("renderdisabled") on the Field base (as Tapestry's AbstractField does).
test.describe("RenderDisabled mixin (auto-applied to the Field base via @Mixin)", () => {
  test("a disabled field renders disabled, an enabled one does not — with no t:mixins", async ({ page }) => {
    await page.goto("/render-disabled");
    await expect(page.locator("input[name=off]")).toBeDisabled();
    await expect(page.locator("input[name=on]")).not.toBeDisabled();
  });
});

// Ported from app1 BindParameterDemo (EchoValue). A mixin field marked
// @BindParameter is a two-way alias to the host's parameter: the mixin reads it,
// overwrites it during the host's render, and restores it afterward.
test.describe("EchoValue mixin (@BindParameter, two-way host binding)", () => {
  test("reads, overwrites, then restores the host field's bound value", async ({ page }) => {
    await page.goto("/bind-parameter");
    // the mixin read the original value before the host rendered
    await expect(page.locator("#testmixin_before")).toHaveText("initial-before");
    // the mixin's write reached the host: the field rendered the overwritten value
    await expect(page.locator("input[name=testmixin]")).toHaveValue("temporaryvaluefromechovaluemixin");
    // the mixin restored it: its _after echo and the page's own output show the original
    await expect(page.locator("#testmixin_after")).toHaveText("initial-after");
    await expect(page.locator("#mypropertyoutput")).toHaveText("initial");
  });

  test("wraps the host: _before precedes the field, _after follows it", async ({ page }) => {
    await page.goto("/bind-parameter");
    const FOLLOWING = 4; // Node.DOCUMENT_POSITION_FOLLOWING
    const order = await page.evaluate((f) => {
      const before = document.getElementById("testmixin_before")!;
      const input = document.querySelector("input[name=testmixin]")!;
      const after = document.getElementById("testmixin_after")!;
      return {
        inputAfterBefore: !!(before.compareDocumentPosition(input) & f),
        afterAfterInput: !!(input.compareDocumentPosition(after) & f),
      };
    }, FOLLOWING);
    expect(order.inputAfterBefore).toBe(true);
    expect(order.afterAfterInput).toBe(true);
  });
});
