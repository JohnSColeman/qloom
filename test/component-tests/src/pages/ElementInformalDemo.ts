import { Page, Property } from "@qloom/runtime";

/** Element-form <t:textfield> with a bare `placeholder` — an informal HTML
 *  attribute that must render, not be force-compiled as a PEL expression. */
export class ElementInformalDemo extends Page {
  @Property name = "";
  @Property secret = "";
}
