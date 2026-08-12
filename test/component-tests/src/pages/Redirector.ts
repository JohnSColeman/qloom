import { Page } from "@qloom/runtime";

/** onActivate redirects to redirect-target. Its URL must NOT survive in history
 *  (the router replaces, not pushes, so Back skips past it). */
export class Redirector extends Page {
  override onActivate(): unknown {
    return "redirect-target";
  }
}
