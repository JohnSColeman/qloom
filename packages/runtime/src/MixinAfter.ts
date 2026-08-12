import { MIXIN_AFTER } from "@qloom/core";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tapestry's `@MixinAfter`, ported. A marker class decorator on a mixin: its
 * render-phase methods run *after* the host component's within each phase
 * (before-mixins → component → after-mixins). Without it, a mixin runs before
 * the host. Attribute-writing mixins (e.g. `Confirm`) use it so the host's
 * element is already open when they add attributes; body-suppressing mixins
 * (e.g. `DiscardBody`) use it so their `false` from `beforeRenderBody` overrides.
 */
export function MixinAfter(ctor: Function): void {
  (ctor as any).prototype[MIXIN_AFTER] = true;
}
