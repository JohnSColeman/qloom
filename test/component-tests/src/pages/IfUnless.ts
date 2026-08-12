import { Page, Property } from "@qloom/runtime";

/** Covers If (then/else), Unless, and Delegate-to-block scenarios. */
export class IfUnless extends Page {
  @Property truthy = true;
  @Property falsy = false;
  // Raw markup used to assert body content is HTML-escaped (rendered as text).
  @Property special = "<b>&</b>";
}
