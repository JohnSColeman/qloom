import { Page, Property } from "@qloom/runtime";

/**
 * tapestry: LoopTests — edge/chaos coverage for Loop: single element, a
 * non-array iterable (Set), HTML-escaping of item text, an index-less loop,
 * and a larger boundary count.
 */
export class LoopEdgeDemo extends Page {
  // Exactly one element.
  @Property single = ["only"];
  @Property s = "";
  @Property si = 0;

  // A non-array Iterable — Loop iterates via Symbol.iterator, not indexing.
  @Property setSource = new Set(["a", "b", "c"]);
  @Property setVal = "";
  @Property setIdx = 0;

  // Item text containing markup must render as literal text (escaped).
  @Property escapes = ["<b>x</b>", "a & b"];
  @Property esc = "";
  @Property ei = 0;

  // No `index` bound — index is optional.
  @Property noIdx = [10, 20];
  @Property niVal = 0;

  // Larger count to assert every row renders (boundary).
  @Property big = Array.from({ length: 25 }, (_, i) => i);
  @Property bigVal = 0;
  @Property bigIdx = 0;
}
