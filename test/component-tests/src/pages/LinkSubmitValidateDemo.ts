import { Page, Property } from "@qloom/runtime";
import { Navigation } from "@qloom/core";

/**
 * tapestry: LinkSubmit submits the enclosing Form, which runs validation first.
 * The `name` field is `required` and starts empty, so an unmodified submit is
 * blocked (field flagged, no PRG); filling it lets the LinkSubmit-triggered
 * submit succeed and PRG to linksubmit-result.
 */
export class LinkSubmitValidateDemo extends Page {
  @Property name = "";

  onSubmitFromForm(): void {
    Navigation.navigate("linksubmit-result", [this.name]);
  }
}
