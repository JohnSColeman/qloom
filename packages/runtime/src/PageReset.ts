import { registerLifecycle } from "./registerLifecycle.js";

/** Tapestry `@PageReset`: run this method on the `pageReset` page-lifecycle event.
 *  Equivalent to naming the method `pageReset`. */
export function PageReset(target: object, key: string): void {
  registerLifecycle(target, "pageReset", key);
}
