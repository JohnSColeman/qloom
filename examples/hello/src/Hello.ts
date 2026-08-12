import { Page, Property } from "@qloom/runtime";

/**
 * Exercises M2 (a `<t:panel>` component with a bound `@Parameter`, nested
 * `<t:if>` and `<t:loop>`) and M3 (an `<t:eventlink>` triggers the `increment`
 * event in memory; `onIncrement` mutates state; the `<t:zone>` re-renders
 * through the reconciler — no full-page re-render, no server round-trip).
 */
export class Hello extends Page {
  @Property name = "world";
  @Property mood = "sunny";
  @Property title = "Greetings";
  @Property items = ["alpha", "beta", "gamma"];
  @Property item = ""; // loop variable — bound by <t:loop value="item">

  @Property count = 0;

  get hasItems(): boolean {
    return this.items.length > 0;
  }

  onIncrement(): void {
    this.count += 1;
  }
}
