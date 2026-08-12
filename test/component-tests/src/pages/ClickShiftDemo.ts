import { Page, Property } from "@qloom/runtime";

/**
 * Reproduces the "click on submit is cancelled by blur-time error decoration"
 * bug: two required fields stacked above a submit button; the first is
 * auto-focused. Clicking the button blurs the first field, whose blur-validation
 * inserts a (block, in `.click-shift` CSS) error icon that reflows the button
 * downward — so a real mouse click's mouseup misses it and the form never
 * submits. See tests/ClickShift.spec.ts.
 */
export class ClickShiftDemo extends Page {
  @Property alpha = "";
  @Property beta = "";
}
