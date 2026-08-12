import { Page, Property } from "@qloom/runtime";
import { Navigation } from "@qloom/core";

/**
 * tapestry: BeanEditorTests — BeanEditForm generates a whole form to edit a
 * bean's properties (a field per property + submit).
 */
export class BeanEditorDemo extends Page {
  @Property person = { firstName: "Ada", lastName: "Lovelace" };

  /** BeanEditForm (t:id="editor") pulls the edited values into the bean before
   *  firing submit, so this handler sees the current field contents (PRG carries
   *  them on). Named for the component id per Tapestry's on<Event>From<Id>. */
  onSubmitFromEditor(): void {
    Navigation.navigate("submit-result", [this.person.firstName]);
  }
}
