import { Page, Property } from "@qloom/runtime";
import { Navigation } from "@qloom/core";

/**
 * tapestry: PaletteTests — a re-orderable Palette (`reorder="true"`). Moved
 * options append to the bottom of the selected list, and up/down buttons reorder
 * the selection (order is preserved on submit).
 */
export class PaletteReorderDemo extends Page {
  @Property selected: string[] = ["Green", "Red"];

  onSubmitFromForm(): void {
    Navigation.navigate("palette-result", this.selected);
  }
}
