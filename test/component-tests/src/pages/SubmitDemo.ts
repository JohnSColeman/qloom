import { Page, Property } from "@qloom/runtime";
import { Navigation } from "@qloom/core";

/**
 * tapestry: SubmitTest — Submit renders an <input type="submit"> that forces the
 * enclosing Form to submit (here: PRG carrying the bound field value onward).
 */
export class SubmitDemo extends Page {
  @Property name = "Ada";

  onSubmitFromForm(): void {
    Navigation.navigate("submit-result", [this.name]);
  }
}
