import { CHILDREN } from "@qloom/core";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Injects a reference to an embedded component (declared in this component's
 * template) by its `t:id`. Tapestry: `@InjectComponent`. The id defaults to the
 * annotated field's name (Tapestry's convention); pass an explicit id to
 * override. The field is read-only and resolves to the child instance once it
 * has rendered — so it is available inside event handlers, as in Tapestry.
 */
export function InjectComponent(id?: string) {
  return function (target: object, key: string): void {
    const childId = id ?? key;
    Object.defineProperty(target, key, {
      configurable: true,
      enumerable: true,
      get(this: any) {
        return this[CHILDREN]?.[childId];
      },
    });
  };
}
