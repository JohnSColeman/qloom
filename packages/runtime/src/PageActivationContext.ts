import { ACTIVATION_CONTEXT } from "@qloom/core";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Two-way binds a page field to a slot of the URL activation context. Tapestry:
 * `@PageActivationContext`. Multiple annotated fields map to successive context
 * segments in declaration order: on activation the router populates them from
 * the URL (before `onActivate`); on render it synthesises the passivated context
 * from them (unless the page defines its own `onPassivate`). This keeps the page
 * bookmarkable/reload-safe (PLAN §3).
 *
 * The router coerces each segment to the field's default-value type
 * (string/number/boolean). Entity-by-id fields that need a fetch stay on
 * `onActivate` — Qloom has no Tapestry ValueEncoder.
 */
export function PageActivationContext() {
  return function (target: object, key: string): void {
    const proto = target as any;
    // Copy-on-write per prototype so a subclass doesn't mutate its parent's list
    // (inheritance-aware, matching @Property's PROPS handling).
    const list: string[] = Object.prototype.hasOwnProperty.call(proto, ACTIVATION_CONTEXT)
      ? proto[ACTIVATION_CONTEXT]
      : (proto[ACTIVATION_CONTEXT] = [...(proto[ACTIVATION_CONTEXT] ?? [])]);
    list.push(key);
  };
}
