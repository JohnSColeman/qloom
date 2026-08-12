import { registerLifecycle } from "./registerLifecycle.js";

/** Tapestry `@PageLoaded`: run this method on the `pageLoaded` page-lifecycle event.
 *  Equivalent to naming the method `pageLoaded`. */
export function PageLoaded(target: object, key: string): void {
  registerLifecycle(target, "pageLoaded", key);
}
