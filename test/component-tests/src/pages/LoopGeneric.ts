import { Page, Property } from "@qloom/runtime";

/** tapestry: LoopTests#generic_loop — loop over numbers and objects. */
export class LoopGeneric extends Page {
  @Property ints = [1, 3, 5, 7, 11];
  @Property n = 0; // loop value
  @Property i = 0; // loop index
  @Property people = ["John Doe", "Jane Dover", "James Jackson"];
  @Property person = "";
  @Property j = 0;
}
