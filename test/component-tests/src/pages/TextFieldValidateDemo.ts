import { Page, Property } from "@qloom/runtime";
import { Navigation } from "@qloom/core";

/**
 * tapestry: FormTests — richer TextField coverage: length validators
 * (`minlength`/`maxlength`), an informal `placeholder`, a `disabled` pass-through
 * field, a pre-filled default, and an HTML-bearing value (escaping/injection).
 * A valid submit does PRG carrying the `code` value onward.
 */
export class TextFieldValidateDemo extends Page {
  @Property code = "";
  @Property nick = "locked";
  @Property raw = '<b>x</b> & "q"';

  onSubmitFromForm(): void {
    Navigation.navigate("textfield-result", [this.code]);
  }
}
