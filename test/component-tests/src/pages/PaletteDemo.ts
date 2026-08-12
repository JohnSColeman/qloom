import { Page, Property } from "@qloom/runtime";
import { Navigation } from "@qloom/core";

/**
 * tapestry: PaletteTests — Palette is a multiple-selection component rendering an
 * "available" list and a "selected" list.
 */
export class PaletteDemo extends Page {
  // A pre-selected value drives the available/selected split (the core of the
  // `selected` two-way binding): "Green" starts in the selected list.
  @Property selected: string[] = ["Green"];

  // On submit the Form pulls the "selected" list box back into `selected`
  // (the two-way collection binding); echo it via PRG so a spec can assert it.
  onSubmitFromForm(): void {
    Navigation.navigate("palette-result", this.selected);
  }
}
