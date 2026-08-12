import { Page, Property } from "@qloom/runtime";

type Row = { name: string; city: string; price: number };

/** tapestry: GridTests — an empty source renders the `p:empty` block instead of
 *  a table, and must not crash. */
export class GridEmptyDemo extends Page {
  @Property items: Row[] = [];
  @Property currentItem!: Row;
}
