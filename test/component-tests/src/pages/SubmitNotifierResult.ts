import { Page, Property } from "@qloom/runtime";

/** PRG target — proves SubmitNotifier fired during submission. */
export class SubmitNotifierResult extends Page {
  @Property who = "";

  override onActivate(context: readonly string[]): void {
    this.who = context[0] ?? "";
  }
}
