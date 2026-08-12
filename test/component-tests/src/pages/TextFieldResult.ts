import { Page, Property } from "@qloom/runtime";

/** PRG target — echoes the two-way-bound TextField value from the URL context. */
export class TextFieldResult extends Page {
  @Property who = "";

  override onActivate(context: readonly string[]): void {
    this.who = context[0] ?? "";
  }
}
