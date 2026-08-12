import { Page, Property } from "@qloom/runtime";

/** tapestry: TreeTests — an empty model renders an empty tree (no nodes) and
 *  must not crash. */
export class TreeEmptyDemo extends Page {
  @Property model: unknown[] = [];
}
