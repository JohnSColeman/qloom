import { test, expect } from "@playwright/test";

// Source: integration/app1/LoopTests.java
test.describe("Loop", () => {
  // tapestry: LoopTests#generic_loop
  test("generic loop renders each item by index", async ({ page }) => {
    await page.goto("/loop-generic");
    for (const [i, v] of ["1", "3", "5", "7", "11"].entries()) {
      await expect(page.locator(`#int_${i}`)).toHaveText(v);
    }
    for (const [i, v] of ["John Doe", "Jane Dover", "James Jackson"].entries()) {
      await expect(page.locator(`#person_${i}`)).toHaveText(v);
    }
  });

  // tapestry: LoopTests#handling_of_empty_loop (TAP5-205) — empty source
  test("empty-list source renders nothing", async ({ page }) => {
    await page.goto("/loop-empty");
    await expect(page.locator("#first")).toHaveText("");
    await expect(page.locator("#third")).toHaveText("");
  });

  // tapestry: LoopTests#handling_of_empty_loop (TAP5-205) — null source
  // A null source must render empty WITHOUT crashing. The crash surfaces as an
  // unhandled promise rejection (the page render is async), which page.on
  // ("pageerror") does NOT catch — so listen for it explicitly, otherwise a
  // throwing Loop still leaves an empty <p> and this test would pass blind.
  test("null source renders nothing and does not crash", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    await page.goto("/loop-null");
    await expect(page.locator("#second")).toHaveText("");
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });

  // tapestry: LoopTests — a single-element source renders exactly one row
  test("single-element source renders exactly one row", async ({ page }) => {
    await page.goto("/loop-edge");
    await expect(page.locator("#single li")).toHaveCount(1);
    await expect(page.locator("#single_0")).toHaveText("only");
  });

  // tapestry: LoopTests — Loop iterates any Iterable, not just arrays (a Set)
  test("iterates a non-array iterable source", async ({ page }) => {
    await page.goto("/loop-edge");
    await expect(page.locator("#setlist .setrow")).toHaveCount(3);
    for (const [i, v] of ["a", "b", "c"].entries()) {
      await expect(page.locator(`#set_${i}`)).toHaveText(v);
    }
  });

  // edge: item text is HTML-escaped — markup in a value renders as literal text
  test("escapes markup in item text", async ({ page }) => {
    await page.goto("/loop-edge");
    await expect(page.locator("#esc_0")).toHaveText("<b>x</b>");
    await expect(page.locator("#esc_0 b")).toHaveCount(0);
    await expect(page.locator("#esc_1")).toHaveText("a & b");
  });

  // edge: the `index` parameter is optional — a loop without it still iterates
  test("iterates without a bound index parameter", async ({ page }) => {
    await page.goto("/loop-edge");
    await expect(page.locator("#noindex .ni")).toHaveCount(2);
    await expect(page.locator("#noindex .ni").first()).toHaveText("10");
    await expect(page.locator("#noindex .ni").last()).toHaveText("20");
  });

  // edge: a larger source renders every row with the correct index/value
  test("renders every row of a larger source", async ({ page }) => {
    await page.goto("/loop-edge");
    await expect(page.locator("#biglist .big")).toHaveCount(25);
    await expect(page.locator("#big_0")).toHaveText("0");
    await expect(page.locator("#big_24")).toHaveText("24");
  });

  // chaos: repeated re-navigation re-runs the render program without leaking
  // rows or surfacing errors (each render starts a fresh iterator).
  test("repeated re-navigation renders stably", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") failures.push(m.text());
    });
    for (let n = 0; n < 4; n++) {
      await page.goto("/loop-edge");
      await expect(page.locator("#biglist .big")).toHaveCount(25);
      await expect(page.locator("#setlist .setrow")).toHaveCount(3);
    }
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });

  // tapestry: LoopTests#encoded_loop_inside_a_form
  // skip: needs Form + AddRow/Update round-trip (Form family, follow-on plan).
  test.skip("encoded loop inside a form round-trips edited values", async () => {});

  // tapestry: LoopTests#volatile_loop_inside_a_form
  // skip: volatile form-loop; same dependency as encoded_loop_inside_a_form.
  test.skip("volatile loop inside a form round-trips edited values", async () => {});

  // tapestry: LoopTests#after_render_does_not_shortcut_other_after_render_phase_methods
  // skip: mixin-dependent (Tracer mixin); mixins are out of scope per BACKLOG.md.
  test.skip("afterRender does not shortcut sibling mixin afterRender phases", async () => {});
});

// Source: corelib/components/Loop.java — `element` (wrap each iteration) and
// `empty` (a <p:empty> Block rendered when the source is null/empty).
test.describe("Loop element/empty", () => {
  // tapestry: element="li" renders an <li> around each iteration's body
  test("element wraps each iteration's body in the named element", async ({ page }) => {
    await page.goto("/loop-element-empty");
    await expect(page.locator("#wrapped > li")).toHaveCount(3);
    await expect(page.locator("#wrapped > li .cell")).toHaveText(["x", "y", "z"]);
  });

  // tapestry: the wrapper is a real element containing the body, not a sibling
  test("the wrapper element actually contains the row body", async ({ page }) => {
    await page.goto("/loop-element-empty");
    // each <li> holds exactly one .cell
    await expect(page.locator("#wrapped > li").first().locator(".cell")).toHaveText("x");
    await expect(page.locator("#wrapped .cell")).toHaveCount(3);
  });

  // tapestry: <p:empty> renders instead of the loop when the source is empty
  test("empty block renders when the source is empty", async ({ page }) => {
    await page.goto("/loop-element-empty");
    await expect(page.locator("#emptyblock .noitems")).toHaveText("No items");
    await expect(page.locator("#emptyblock .row")).toHaveCount(0);
  });

  // tapestry: the <p:empty> block is NOT rendered when the source has items
  test("empty block is not rendered when the source is non-empty", async ({ page }) => {
    await page.goto("/loop-element-empty");
    await expect(page.locator("#nonemptyblock .noitems2")).toHaveCount(0);
    await expect(page.locator("#nonemptyblock .row2")).toHaveText(["x", "y", "z"]);
  });

  // edge: element + empty together over an empty source → only the empty block,
  // no wrapper element and no rows
  test("element + empty over an empty source renders only the empty block", async ({ page }) => {
    await page.goto("/loop-element-empty");
    await expect(page.locator("#wrappedempty .noitems3")).toHaveText("Nothing");
    await expect(page.locator("#wrappedempty > li")).toHaveCount(0);
    await expect(page.locator("#wrappedempty .cell3")).toHaveCount(0);
  });

  // edge: element over an empty source with no empty block renders nothing
  test("element over an empty source with no empty block renders nothing", async ({ page }) => {
    await page.goto("/loop-element-empty");
    await expect(page.locator("#wrappednone > li")).toHaveCount(0);
    await expect(page.locator("#wrappednone .cell4")).toHaveCount(0);
  });

  // chaos: rendering element/empty loops raises no page or console errors
  test("renders element/empty loops without page or console errors", async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") failures.push(m.text()); });
    await page.goto("/loop-element-empty");
    await expect(page.locator("#wrapped > li")).toHaveCount(3);
    await page.waitForLoadState("networkidle");
    expect(failures).toEqual([]);
  });
});
