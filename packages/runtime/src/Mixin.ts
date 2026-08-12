import { CLASS_MIXINS } from "@qloom/core";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Declares an **implementation mixin** on a component class — Tapestry `@Mixin`.
 * Unlike template `t:mixins` (which attaches a mixin to one usage), a class
 * decorated with `@Mixin` *always* carries that mixin, on every instance, with no
 * mention in any `.tml`. This is how a base component folds in behavior (e.g. a
 * field base carrying `RenderDisabled`).
 *
 * `name` is the registry id of the mixin (as with `t:mixins`). `order` gives
 * ordering constraints against other attached mixins — `before:<name>`,
 * `after:<name>`, or `before:*` / `after:*` for all. Stack the decorator to
 * declare several; attaching the same mixin twice (here or via `t:mixins`) is a
 * fail-loud error.
 *
 * Qloom divergence: Tapestry's `@Mixin` annotates a field (whose type names the
 * mixin) so the instance can be injected back. TypeScript erases field types, so
 * Qloom makes it a class decorator taking the registry name; injecting the mixin
 * instance back into the host is not supported (rarely needed).
 */
export function Mixin(name: string, opts?: { order?: string[] }) {
  return function (ctor: Function): void {
    const proto = (ctor as any).prototype;
    const list: { name: string; order: string[] }[] = Object.prototype.hasOwnProperty.call(
      proto,
      CLASS_MIXINS,
    )
      ? proto[CLASS_MIXINS]
      : (proto[CLASS_MIXINS] = []);
    list.push({ name: name.toLowerCase(), order: opts?.order ?? [] });
  };
}
