import { Page, Property } from "@qloom/runtime";
import { Navigation } from "@qloom/core";

/**
 * tapestry: FormTests / ZoneTests — LinkSubmit is a client-side hyperlink that
 * submits the enclosing Form.
 */
export class LinkSubmitDemo extends Page {
  @Property name = "Ada";

  onSubmitFromForm(): void {
    Navigation.navigate("linksubmit-result", [this.name]);
  }
}
