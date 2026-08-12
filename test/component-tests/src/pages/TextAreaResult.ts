import { Page, Property } from "@qloom/runtime";

/** PRG target — echoes the two-way-bound TextArea value (for when implemented). */
export class TextAreaResult extends Page {
  @Property who = "";

  override onActivate(context: readonly string[]): void {
    this.who = context[0] ?? "";
  }
}
