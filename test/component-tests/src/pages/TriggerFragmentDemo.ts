import { Page, Property } from "@qloom/runtime";
import { Navigation } from "@qloom/core";

/** Ported from Tapestry TriggerFragment: a checkbox drives a FormFragment's
 *  visibility (invert: checked hides). Hiding the fragment excludes its required
 *  field from submit — so with the fragment hidden, the blank required field no
 *  longer blocks submission. */
export class TriggerFragmentDemo extends Page {
  @Property sameAddress = false;
  @Property shippingCity = "";

  onSubmitFromForm(): void {
    Navigation.navigate("submit-result", [this.shippingCity || "blank"]);
  }
}
