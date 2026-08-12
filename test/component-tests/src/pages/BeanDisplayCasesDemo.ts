import { Page, Property } from "@qloom/runtime";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * tapestry: BeanEditorTests — BeanDisplay as a <dl>. Covers camelCase humanized
 * dt labels, dt/dd carrying the property id as a class, boolean/number values,
 * an HTML-special value escaped in the dd, exclude, a <p:property> block override,
 * informal class merged with t-beandisplay, and a null object.
 */
export class BeanDisplayCasesDemo extends Page {
  @Property hotel = {
    fullName: "Grand <Hotel>",
    starRating: 5,
    oceanView: true,
    nightlyRate: 199,
  };
  @Property secret = { name: "Visible", secretId: "z" };
  @Property missing: any = null;
}
