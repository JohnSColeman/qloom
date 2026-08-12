import { CONTAINER } from "@qloom/core";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Injects the component that contains this one. Tapestry: `@InjectContainer`.
 * For a **mixin**, this resolves to the host component the mixin is attached to
 * (the mixin's container is set to its host at render time) — the canonical way
 * a mixin reads host state (as `RenderDisabled` reads the field's `disabled`).
 * For a plain component it is the enclosing container. Read-only.
 */
export function InjectContainer(target: object, key: string): void {
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    get(this: any) {
      return this[CONTAINER];
    },
  });
}
