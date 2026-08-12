import type { RouterHooks } from "./types.js";

/**
 * Navigation + page-activation hooks. The router installs the concrete
 * implementation; components call `navigate`/`pathFor` without knowing about it.
 * Shared mutable state, so a static class (module architecture rule 2).
 */
export class Navigation {
  private static router: RouterHooks | undefined;
  // The router fires one activation per page; the runtime subscribes to age
  // flash-scoped @Persist state (one activation = one Tapestry "request").
  private static readonly listeners: Array<() => void> = [];

  static installRouter(hooks: RouterHooks): void {
    Navigation.router = hooks;
  }

  /** Subscribe to page-activation events (used by @qloom/runtime for flash). */
  static onNavigation(listener: () => void): void {
    Navigation.listeners.push(listener);
  }

  /** Fired by the router at the start of each page activation. */
  static notifyNavigation(): void {
    for (const l of Navigation.listeners) l();
  }

  /** Navigate to a page (by class, route name, or returned page). No-op if no
   *  router is installed (e.g. a component used without one). */
  static navigate(target: unknown, context?: unknown[]): void {
    if (!Navigation.router) {
      console.warn("qloom: navigate() called before a router was installed");
      return;
    }
    Navigation.router.navigate(target, context);
  }

  /** Compute the URL path for a page target — the real `href` for links. */
  static pathFor(target: unknown, context?: unknown[]): string {
    return Navigation.router ? Navigation.router.pathFor(target, context) : "#";
  }
}
