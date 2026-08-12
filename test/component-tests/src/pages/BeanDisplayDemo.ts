import { Page, Property } from "@qloom/runtime";

/**
 * tapestry: BeanEditorTests — BeanDisplay renders a bean's properties as a <dl>
 * of dt/dd pairs, with humanized labels and an include list controlling order.
 */
export class BeanDisplayDemo extends Page {
  @Property hotel = { name: "Hilton Downtown", city: "Chicago", stars: 4 };
}
