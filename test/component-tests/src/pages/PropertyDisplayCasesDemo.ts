import { Page, Property } from "@qloom/runtime";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * tapestry: PropertyDisplay outputs object[property] as *escaped* text. Covers
 * number/boolean/null values, a missing property, a null object, an HTML-special
 * value, and a Zone re-render with a hostile value that must stay escaped.
 */
export class PropertyDisplayCasesDemo extends Page {
  @Property bean = { count: 7, active: false, title: "<b>hi</b>", nil: null as string | null };
  @Property missingObj: any = null;
  @Property live: { name: string } = { name: "safe" };

  onPoison(): void {
    this.live = { name: '<img src=x onerror="window.__pdXss = true">' };
  }
}
