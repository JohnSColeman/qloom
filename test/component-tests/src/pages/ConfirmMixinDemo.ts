import { Page } from "@qloom/runtime";
import { Navigation } from "@qloom/core";

/** app1 ConfirmDemo: an ActionLink with the `confirm` mixin; the mixin gates the
 *  click behind a confirmation, and only a confirmed click fires the action. */
export class ConfirmMixinDemo extends Page {
  onActionFromGo(): void {
    Navigation.navigate("confirm-result");
  }
}
