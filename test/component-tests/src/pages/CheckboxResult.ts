import { Page, Property } from "@qloom/runtime";

/** PRG target — echoes the two-way-bound Checkbox boolean from the URL context. */
export class CheckboxResult extends Page {
  @Property who = "";

  override onActivate(context: readonly string[]): void {
    this.who = context[0] ?? "";
  }
}
