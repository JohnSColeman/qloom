import { Page, InjectPage } from "@qloom/runtime";
import { InjectPageTarget } from "./InjectPageTarget";

/** @InjectPage yields the target page instance; returning it from the event
 *  handler navigates there (the router routes by constructor). */
export class InjectPageDemo extends Page {
  @InjectPage(InjectPageTarget)
  target!: InjectPageTarget;

  onGo(): unknown {
    return this.target;
  }
}
