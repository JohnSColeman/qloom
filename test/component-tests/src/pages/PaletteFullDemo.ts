import { Page, Property } from "@qloom/runtime";

/**
 * tapestry: PaletteTests — every option pre-selected. Exercises the empty
 * "available" list edge and confirms the "selected" list renders in the bound
 * collection's order (Blue, Green, Red) rather than the model's (Red, Green, Blue).
 */
export class PaletteFullDemo extends Page {
  @Property selected: string[] = ["Blue", "Green", "Red"];
}
