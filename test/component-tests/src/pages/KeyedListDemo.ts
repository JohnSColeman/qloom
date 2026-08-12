import { Page, Property } from "@qloom/runtime";

/** A keyed list in a zone. Rotating reorders the items and refreshes the zone;
 *  keyed reconciliation must reuse each row's DOM node (so a value typed into a
 *  row's input follows that row, not its old position). */
export class KeyedListDemo extends Page {
  @Property items = ["a", "b", "c"];
  @Property item = ""; // Loop value var

  onRotate(): void {
    const first = this.items.shift();
    if (first) this.items.push(first); // [a,b,c] → [b,c,a]
  }

  // Prepend a new key: existing rows must be reused (matched by key) even though
  // every one shifts position.
  onInsert(): void {
    if (!this.items.includes("z")) this.items.unshift("z"); // [a,b,c] → [z,a,b,c]
  }

  // Remove a middle key: its node is dropped, the survivors keep their nodes.
  onRemove(): void {
    this.items = this.items.filter((i) => i !== "b"); // [a,b,c] → [a,c]
  }
}
