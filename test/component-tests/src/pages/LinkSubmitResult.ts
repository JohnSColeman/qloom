import { Page, Property } from "@qloom/runtime";

/** PRG target — proves the LinkSubmit-triggered form submission (for when built). */
export class LinkSubmitResult extends Page {
  @Property who = "";

  override onActivate(context: readonly string[]): void {
    this.who = context[0] ?? "";
  }
}
