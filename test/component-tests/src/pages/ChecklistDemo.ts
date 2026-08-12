import { Page, Property } from "@qloom/runtime";
import { Navigation } from "@qloom/core";

/**
 * tapestry: FormTests — Checklist renders a vertical list of checkboxes, binding
 * a collection of the selected values. On submit the form does PRG, carrying the
 * two-way-bound `selected` collection onward.
 */
export class ChecklistDemo extends Page {
  @Property selected: string[] = [];

  onSubmitFromForm(): void {
    Navigation.navigate("checklist-result", this.selected);
  }
}
