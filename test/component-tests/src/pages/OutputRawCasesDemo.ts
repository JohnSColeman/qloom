import { Page, Property } from "@qloom/runtime";

/**
 * tapestry: OutputRawTest — OutputRaw writes unfiltered markup (real elements,
 * decoded entities). Covers null (empty, no crash), multiple elements, and a Zone
 * re-render that swaps the raw markup.
 */
export class OutputRawCasesDemo extends Page {
  @Property markup = "<b>bold</b>";
  @Property entity = "a &amp; b";
  @Property nothing: string | null = null;
  @Property multi = "<i>one</i><i>two</i>";
  @Property live = "<span id='raw-live-1'>one</span>";

  onSwap(): void {
    this.live = "<span id='raw-live-2'>two</span>";
  }
}
