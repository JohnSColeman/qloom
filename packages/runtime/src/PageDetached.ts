import { registerLifecycle } from "./registerLifecycle.js";

/** Tapestry `@PageDetached`: run this method on the `pageDetached` page-lifecycle event.
 *  Equivalent to naming the method `pageDetached`. */
export function PageDetached(target: object, key: string): void {
  registerLifecycle(target, "pageDetached", key);
}
