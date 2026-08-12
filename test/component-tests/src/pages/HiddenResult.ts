import { Page, Property } from "@qloom/runtime";

/** PRG target — echoes the round-tripped Hidden value (for when implemented). */
export class HiddenResult extends Page {
  @Property who = "";

  override onActivate(context: readonly string[]): void {
    this.who = context[0] ?? "";
  }
}
