import { Page, Property } from "@qloom/runtime";

/**
 * A loop nested inside a loop, inside a form: an outer loop over groups, an inner
 * loop over each group's items, each item an editable field. Submitting must
 * round-trip every field to its own nested item — exercising the Loop's
 * save/restore of the enclosing row context across nesting.
 */
export class NestedLoopFormDemo extends Page {
  @Property groups: { items: { name: string }[] }[] = [
    { items: [{ name: "a1" }, { name: "a2" }] },
    { items: [{ name: "b1" }, { name: "b2" }] },
  ];
  @Property group!: { items: { name: string }[] };
  @Property item!: { name: string };

  get joined(): string {
    return this.groups.map((g) => g.items.map((i) => i.name).join("+")).join(",");
  }
}
