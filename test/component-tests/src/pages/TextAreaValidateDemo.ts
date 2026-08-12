import { Page, Property } from "@qloom/runtime";
import { Navigation } from "@qloom/core";

/**
 * tapestry: FormTests — TextArea validation coverage: `required` + `minlength`,
 * an informal `placeholder`, a pre-filled default (text content), and an
 * HTML-bearing value (escaping/injection). Valid submit does PRG carrying `bio`.
 */
export class TextAreaValidateDemo extends Page {
  @Property bio = "";
  @Property note = "<i>x</i>";

  onSubmitFromForm(): void {
    Navigation.navigate("textarea-result", [this.bio]);
  }
}
