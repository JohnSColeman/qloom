import { Page, Property } from "@qloom/runtime";
import { Navigation } from "@qloom/core";

/**
 * tapestry: Submit `mode` (SubmitMode). NORMAL submits with client-side
 * validation; CANCEL and UNCONDITIONAL bypass client-side validation. Here the
 * `name` field is `required` and left blank, so only a validation-bypassing
 * submit reaches the handler.
 */
export class SubmitModeDemo extends Page {
  @Property name = "";

  onSubmitFromForm(): void {
    Navigation.navigate("submit-result", [this.name || "blank"]);
  }
}
