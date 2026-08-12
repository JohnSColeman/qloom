import { LIFECYCLE } from "@qloom/core";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Map a page-lifecycle callback to the method that implements it, on a prototype
 *  (used by the `@PageLoaded`/`@PageAttached`/`@PageDetached`/`@PageReset`
 *  decorators). Mirrors `registerPhase`, but under the `LIFECYCLE` key. */
export function registerLifecycle(target: object, callback: string, method: string): void {
  const proto = target as any;
  const map: Record<string, string> = Object.prototype.hasOwnProperty.call(proto, LIFECYCLE)
    ? proto[LIFECYCLE]
    : (proto[LIFECYCLE] = { ...(proto[LIFECYCLE] ?? {}) });
  map[callback] = method;
}
