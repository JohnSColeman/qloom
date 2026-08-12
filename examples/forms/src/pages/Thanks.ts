import { Page, Property } from "@qloom/runtime";

/** Success page — reads the name PRG-navigated in the URL (proves two-way binding). */
export class Thanks extends Page {
  @Property who = "";
  @Property checkin = "";
  @Property smoking = "";

  override onActivate(context: readonly string[]): void {
    this.who = context[0] ?? "friend";
    this.checkin = context[2] ?? "";
    this.smoking = context[3] ?? "";
  }
}
