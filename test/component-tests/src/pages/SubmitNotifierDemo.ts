import { Page, Property } from "@qloom/runtime";
import { Navigation } from "@qloom/core";

/**
 * tapestry: SubmitNotifier notifies its container during form submission. Here
 * its `notify` event flips `notified`; the form then PRGs, carrying the flag.
 */
export class SubmitNotifierDemo extends Page {
  @Property notified = false;

  onNotify(): void {
    this.notified = true;
  }

  onSubmitFromForm(): void {
    Navigation.navigate("submitnotifier-result", [String(this.notified)]);
  }
}
