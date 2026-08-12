import { test, expect } from "@playwright/test";

// Keyed zone reconciliation: on reorder/insert/remove, a row is matched by its
// key (data-key/id), so its DOM node — and any uncontrolled state on it, like a
// typed-but-not-committed input value — follows the item, not the position. The
// old positional diff would leave the value on whatever row landed at the old
// index.
test.describe("keyed reconciler", () => {
  test("a reorder preserves each row's node identity (input value follows its item)", async ({
    page,
  }) => {
    await page.goto("/keyed-list");
    await expect(page.locator(".row")).toHaveCount(3);

    // Type into row "b" (uncontrolled — the value lives on that DOM node).
    await page.locator("input[name=b]").fill("X");

    // Rotate: items a,b,c → b,c,a; the zone re-renders.
    await page.locator("#rotate").click();

    // Order is now b, c, a…
    await expect(
      page.locator(".row input").evaluateAll((els) => els.map((e) => e.getAttribute("name"))),
    ).resolves.toEqual(["b", "c", "a"]);

    // …and "X" is still on b's input (same node reused by key), not bled onto
    // whatever row now sits where b used to be.
    await expect(page.locator("input[name=b]")).toHaveValue("X");
    await expect(page.locator("input[name=c]")).toHaveValue("");
    await expect(page.locator("input[name=a]")).toHaveValue("");
  });

  // Node identity, directly: tag the live node with a JS property, reorder, and
  // confirm the SAME node carries the tag afterwards (only true if reused, not
  // recreated — the guarantee that makes value/focus/listeners survive).
  test("a reorder reuses the very same DOM node (JS property survives)", async ({ page }) => {
    await page.goto("/keyed-list");
    await page.evaluate(() => {
      (document.querySelector("input[name=a]") as unknown as { __tag: string }).__tag = "keep";
    });

    await page.locator("#rotate").click(); // a moves to the end
    await expect(
      page.locator(".row input").evaluateAll((els) => els.map((e) => e.getAttribute("name"))),
    ).resolves.toEqual(["b", "c", "a"]);

    const sameNode = await page.evaluate(
      () =>
        (document.querySelector("input[name=a]") as unknown as { __tag?: string }).__tag === "keep",
    );
    expect(sameNode).toBe(true);
  });

  // Insert: prepending a new key shifts every existing row by one position; each
  // must be matched by key and its typed value preserved (positional diff would
  // smear values down the list).
  test("an insert preserves existing rows' typed values (matched by key)", async ({ page }) => {
    await page.goto("/keyed-list");
    await page.locator("input[name=b]").fill("X");

    await page.locator("#insert").click(); // [a,b,c] → [z,a,b,c]

    await expect(
      page.locator(".row input").evaluateAll((els) => els.map((e) => e.getAttribute("name"))),
    ).resolves.toEqual(["z", "a", "b", "c"]);
    await expect(page.locator("input[name=b]")).toHaveValue("X"); // followed its item
    await expect(page.locator("input[name=z]")).toHaveValue(""); // fresh row
  });

  // Remove: dropping a middle key removes exactly that node and leaves the
  // survivors — with their typed values — in place.
  test("a removal drops only the removed row and keeps the others' values", async ({ page }) => {
    await page.goto("/keyed-list");
    await page.locator("input[name=a]").fill("A");
    await page.locator("input[name=c]").fill("C");

    await page.locator("#remove").click(); // [a,b,c] → [a,c]

    await expect(page.locator(".row")).toHaveCount(2);
    await expect(page.locator("input[name=b]")).toHaveCount(0);
    await expect(page.locator("input[name=a]")).toHaveValue("A");
    await expect(page.locator("input[name=c]")).toHaveValue("C");
  });
});
