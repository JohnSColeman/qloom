import { test, expect } from "@playwright/test";

// @Mixin — Tapestry's implementation mixin: a component class permanently carries
// a mixin, with no t:mixins in the template. Also covers merging with template
// mixins, before:/after: ordering constraints, and duplicate-mixin rejection.
test.describe("@Mixin (implementation mixins on a component class)", () => {
  test("a class mixin is applied with no t:mixins in the template", async ({ page }) => {
    await page.goto("/class-mixin");
    // AutoMarked declares @Mixin("markone"); markone stamps data-seq="1".
    await expect(page.locator("#auto-marked")).toHaveAttribute("data-seq", "1");
  });

  test("a class mixin merges with the template's t:mixins", async ({ page }) => {
    await page.goto("/class-mixin");
    // MergedThing: @Mixin("markone") + t:mixins="marktwo" → both, class-first.
    await expect(page.locator("#merged")).toHaveAttribute("data-seq", "12");
  });

  test("before:/after: constraints order the mixins", async ({ page }) => {
    await page.goto("/class-mixin");
    // OrderedThing declares markone then marktwo, but marktwo has before:markone,
    // so it runs first → "21", not the declaration order "12".
    await expect(page.locator("#ordered")).toHaveAttribute("data-seq", "21");
  });

  test("attaching the same mixin twice is a fail-loud error", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.goto("/dup-mixin");
    // markone via @Mixin AND t:mixins → duplicate → reported, and the component
    // does not render its content.
    await expect
      .poll(() => errors.join("\n"))
      .toMatch(/attached more than once/i);
    await expect(page.locator("#dup")).toHaveCount(0);
  });
});
