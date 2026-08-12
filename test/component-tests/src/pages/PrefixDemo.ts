import { Page, Property } from "@qloom/runtime";

/** Drives PrefixThing: `greeting` is the property a prop-default param reads. */
export class PrefixDemo extends Page {
  @Property greeting = "Hi";
}
