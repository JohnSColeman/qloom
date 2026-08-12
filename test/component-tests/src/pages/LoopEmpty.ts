import { Page, Property } from "@qloom/runtime";

/** tapestry: LoopTests#handling_of_empty_loop (TAP5-205). */
export class LoopEmpty extends Page {
  @Property emptyList: number[] = [];
  @Property nullSource: number[] | null = null;
  @Property value = 0;
}
