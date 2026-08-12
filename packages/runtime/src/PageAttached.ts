import { registerLifecycle } from "./registerLifecycle.js";

/** Tapestry `@PageAttached`: run this method on the `pageAttached` page-lifecycle event.
 *  Equivalent to naming the method `pageAttached`. */
export function PageAttached(target: object, key: string): void {
  registerLifecycle(target, "pageAttached", key);
}
