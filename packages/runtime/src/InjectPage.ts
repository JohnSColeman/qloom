import type { Page } from "./Page.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Injects another page instance, for cross-page navigation. Tapestry:
 * `@InjectPage`. Returning the injected page from an event handler navigates to
 * it (the router routes by the instance's constructor); to carry activation
 * context, call `Navigation.navigate(thePage, [ctx])`.
 *
 * Qloom reconstructs pages from the URL on navigation (PLAN §3), so the injected
 * instance is a lazily-created navigation handle — not shared page state. It
 * takes the target page **class** (typed, no route-name string coupling).
 */
export function InjectPage(page: new () => Page) {
  const cache = new WeakMap<object, Page>();
  return function (target: object, key: string): void {
    Object.defineProperty(target, key, {
      configurable: true,
      enumerable: true,
      get(this: any) {
        let instance = cache.get(this);
        if (!instance) {
          instance = new page();
          cache.set(this, instance);
        }
        return instance;
      },
    });
  };
}
