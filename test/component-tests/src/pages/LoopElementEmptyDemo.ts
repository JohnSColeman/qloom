import { Page, Property } from "@qloom/runtime";

/**
 * tapestry: Loop `element` (wrap each iteration's body in the named element) and
 * `empty` (a `<p:empty>` block rendered when the source is null/empty).
 */
export class LoopElementEmptyDemo extends Page {
  @Property items = ["x", "y", "z"];
  @Property none: string[] = [];
  @Property nullSource: string[] | null = null;
  @Property v = "";
}
