import { Page, Property } from "@qloom/runtime";

/** A form inside a zone that an external link refreshes. The refresh must not
 *  wipe focus/input in the form's fields (it did when the form was
 *  markForReplace'd — the whole subtree was swapped). */
export class FormInZoneDemo extends Page {
  @Property name = "";
  @Property count = 0;

  onBump(): void {
    this.count++; // a display change, to prove the zone actually re-rendered
  }
}
