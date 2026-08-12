import { Page, Property } from "@qloom/runtime";

/** PRG target — echoes the two-way-bound DateField value from the URL context. */
export class DateFieldResult extends Page {
  @Property who = "";

  override onActivate(context: readonly string[]): void {
    this.who = context[0] ?? "";
  }
}
