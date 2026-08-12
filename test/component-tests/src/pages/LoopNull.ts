import { Page, Property } from "@qloom/runtime";

/** tapestry: LoopTests#handling_of_empty_loop (TAP5-205) — null source case. */
export class LoopNull extends Page {
  @Property nullSource: number[] | null = null;
  @Property value = 0;
}
