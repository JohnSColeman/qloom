import { Page, Property } from "@qloom/runtime";

/**
 * AjaxFormLoop over an object collection inside a form: editing existing rows and
 * submitting round-trips each row's edit to its item (the same row-context path
 * the general `<t:loop>` uses). Primitive sources don't round-trip — the loop
 * value is an output — so this uses `{ name }` objects, as Tapestry expects.
 */
export class AjaxLoopSubmitDemo extends Page {
  @Property items: { name: string }[] = [{ name: "a" }, { name: "b" }];
  @Property item!: { name: string };

  get joined(): string {
    return this.items.map((i) => i.name).join(",");
  }
}
