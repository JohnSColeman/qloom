import { Page, Property } from "@qloom/runtime";

/** PRG target — proves the Submit-triggered form submission carried the value. */
export class SubmitResult extends Page {
  @Property who = "";

  override onActivate(context: readonly string[]): void {
    this.who = context[0] ?? "";
  }
}
