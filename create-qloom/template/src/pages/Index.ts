import { Page, Property } from "@qloom/runtime";

/**
 * The home page. Qloom pages are plain TypeScript classes — decorators stand in
 * for Tapestry's annotations, and the paired `Index.tml` is the (unchanged)
 * template. The `increment` event bubbles to `onIncrement`, which mutates state;
 * the `<t:zone>` re-renders in place — no hooks, no virtual DOM, no round-trip.
 */
export class Index extends Page {
  @Property count = 0;

  onIncrement(): void {
    this.count += 1;
  }
}
