import { Page, Property } from "@qloom/runtime";
import { Navigation } from "@qloom/core";

/**
 * tapestry: HiddenTest — Hidden records a page property as a value into the form
 * (round-tripped on submit).
 */
export class HiddenDemo extends Page {
  @Property token = "abc123";

  onSubmitFromForm(): void {
    Navigation.navigate("hidden-result", [this.token]);
  }
}
