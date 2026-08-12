import { Page, Property } from "@qloom/runtime";

/** Shows the Checklist's two-way-bound `selected` values, carried here via PRG. */
export class ChecklistResult extends Page {
  @Property chosen: string[] = [];

  override onActivate(context: readonly string[]): void {
    this.chosen = [...context];
  }
}
