import { LIFECYCLE } from "./symbols.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Invoke a page-lifecycle callback on an instance — Tapestry's page lifecycle
 * (`pageLoaded`/`pageAttached`/`pageDetached`/`pageReset`). Resolved by decorator
 * (`@PageLoaded` etc. register a name→method map under `LIFECYCLE`) or by the
 * convention method name.
 *
 * Returns the callback's result **without awaiting** — so a missing or synchronous
 * callback introduces **no microtask boundary**. The Router awaits only when a
 * thenable comes back (an async callback). This matters: the callbacks fire around
 * `onActivate` in the Router, and needlessly deferring a no-op past `onActivate`
 * would reorder startup work a page does there.
 */
export function invokeLifecycle(instance: object, name: string): void | Promise<void> {
  const self = instance as any;
  const method: string = self[LIFECYCLE]?.[name] ?? name;
  const fn = self[method];
  if (typeof fn === "function") return fn.call(self);
}
