import { Page, Property } from "@qloom/runtime";
import { Navigation } from "@qloom/core";

/**
 * tapestry: FormTests — a Checklist whose `selected` collection is pre-populated
 * renders those boxes checked. On submit the form PRGs the two-way-bound
 * collection to the shared checklist-result page.
 */
export class ChecklistStateDemo extends Page {
  @Property selected: string[] = ["Green"]; // pre-selected → Green renders checked

  onSubmitFromForm(): void {
    Navigation.navigate("checklist-result", this.selected);
  }
}
