import { Page, Property } from "@qloom/runtime";
import { Navigation } from "@qloom/core";

/**
 * tapestry: FormTests — TextArea renders a <textarea> and two-way binds multi-line
 * text.
 */
export class TextAreaDemo extends Page {
  @Property message = "";

  onSubmitFromForm(): void {
    Navigation.navigate("textarea-result", [this.message]);
  }
}
