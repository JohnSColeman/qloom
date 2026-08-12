import { Page, Property } from "@qloom/runtime";

/**
 * tapestry: PropertyDisplay outputs a single property value (used by BeanDisplay).
 */
export class PropertyDisplayDemo extends Page {
  @Property hotel = { name: "Hilton Downtown" };
}
