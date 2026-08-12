import { Page, Property } from "@qloom/runtime";
import { Navigation } from "@qloom/core";

/**
 * tapestry: AjaxTests#form_fragment — a hidden FormFragment. Qloom renders the
 * fragment body unconditionally and toggles `display`, but the enclosing Form
 * now excludes a *hidden* fragment's fields from submit-time validation
 * (Tapestry's rule). This demo pairs a visible required field with a
 * hidden-fragment required field: filling the visible one lets submission
 * succeed even though the hidden required field is blank.
 */
export class FormFragmentHiddenDemo extends Page {
  @Property visibleField = "";
  @Property hiddenField = "";

  onSubmitFromForm(): void {
    // Reached only when validation passes — i.e. the hidden required field was
    // correctly excluded. Navigate so a spec can confirm the submit went through.
    Navigation.navigate("submit-result", [this.visibleField]);
  }
}
