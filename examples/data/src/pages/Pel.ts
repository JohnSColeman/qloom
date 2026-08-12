import { Page, Property } from "@qloom/runtime";

/** Exercises the PEL: a method call and a range in the template. */
export class Pel extends Page {
  @Property greeting = "hello";
  @Property pageCount = 3;
  @Property n = 0; // Loop `value` output binding

  label(): string {
    return this.greeting.toUpperCase();
  }
}
