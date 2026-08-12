import { Page, Property } from "@qloom/runtime";
import { Navigation } from "@qloom/core";

/**
 * At "/counter/{n}". The count lives in the URL: `onActivate` reads it,
 * `onPassivate` writes it back, and incrementing navigates to the next count —
 * so reload and back/forward reconstruct state purely from the URL (PLAN §3).
 */
export class Counter extends Page {
  @Property count = 0;

  onActivate(context: readonly string[]): void {
    this.count = Number(context[0] ?? 0);
  }

  onPassivate(): readonly string[] {
    return [String(this.count)];
  }

  onIncrement(): void {
    Navigation.navigate(Counter, [this.count + 1]);
  }
}
