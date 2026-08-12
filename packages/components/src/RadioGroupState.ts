import type { RadioGroupContext } from "./types.js";

/** The shared `RadioGroup` render-state its enclosing `Radio`s read. Shared
 *  mutable render-state, so a static class (module architecture rule 2). */
export class RadioGroupState {
  private static current: RadioGroupContext | null = null;

  static get(): RadioGroupContext | null {
    return RadioGroupState.current;
  }
  static set(group: RadioGroupContext | null): void {
    RadioGroupState.current = group;
  }
}
