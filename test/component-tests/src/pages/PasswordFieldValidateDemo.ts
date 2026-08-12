import { Page, Property } from "@qloom/runtime";
import { Navigation } from "@qloom/core";

/**
 * tapestry: PasswordField validation coverage: a pre-filled `saved` field first
 * (so it takes initial focus), then a `required` + `minlength` `pin`. On a
 * blocked submit the form moves focus to the invalid `pin`. Valid submit does
 * PRG carrying `pin`.
 */
export class PasswordFieldValidateDemo extends Page {
  @Property saved = "cached";
  @Property pin = "";

  onSubmitFromForm(): void {
    Navigation.navigate("passwordfield-result", [this.pin]);
  }
}
