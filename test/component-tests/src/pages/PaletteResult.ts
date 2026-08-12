import { Page, Property } from "@qloom/runtime";

/** PRG target — echoes the Palette's two-way-bound `selected` collection, pulled
 *  from the live "selected" list box on submit and carried in the URL context. */
export class PaletteResult extends Page {
  @Property chosen = "";

  override onActivate(context: readonly string[]): void {
    this.chosen = context.join(",");
  }
}
