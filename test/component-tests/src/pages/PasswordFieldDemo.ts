import { Page, Property } from "@qloom/runtime";
import { Navigation } from "@qloom/core";

/**
 * tapestry: PasswordField — a TextField variant rendered as
 * <input type="password">, two-way binding its value (PRG on submit).
 */
export class PasswordFieldDemo extends Page {
  @Property secret = "";

  onSubmitFromForm(): void {
    Navigation.navigate("passwordfield-result", [this.secret]);
  }
}
