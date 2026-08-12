/**
 * Resolves a URL to a page, parses the activation context from the path,
 * renders it, and mirrors `onPassivate()` back into the address bar. This is the
 * two-way binding that keeps Qloom SPAs bookmarkable and reload-safe (PLAN §3/§8).
 */
import {
  driveInstance,
  DomMarkupWriter,
  Navigation,
  Messages,
  ErrorReporter,
  Zones,
  invokeLifecycle,
  ACTIVATION_CONTEXT,
} from "@qloom/core";
import type { Page } from "@qloom/runtime";
import type { PageClass, PageRoute, RouterOptions } from "./types.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Coerce a raw URL segment to the field's default-value type. */
function coerce(current: unknown, raw: string): unknown {
  if (typeof current === "number") return Number(raw);
  if (typeof current === "boolean") return raw === "true";
  return raw;
}

/** Populate a page's @PageActivationContext fields from the URL context, in
 *  declaration order. No-op for pages without such fields. */
function applyActivationContext(page: any, context: readonly string[]): void {
  const fields: string[] | undefined = page[ACTIVATION_CONTEXT];
  if (!fields) return;
  fields.forEach((field, i) => {
    const raw = context[i];
    if (raw !== undefined) page[field] = coerce(page[field], raw);
  });
}

/** Synthesise the passivated context from a page's @PageActivationContext
 *  fields (declaration order), or undefined when it has none. */
function extractActivationContext(page: any): unknown[] | undefined {
  const fields: string[] | undefined = page[ACTIVATION_CONTEXT];
  if (!fields || fields.length === 0) return undefined;
  return fields.map((field) => page[field]);
}

/** Stringify one activation-context value; an object with an `id` uses it
 *  (the client analogue of Tapestry's ValueEncoder, e.g. `context="hotel"`). */
function ctxToString(item: unknown): string {
  if (item && typeof item === "object" && "id" in (item as Record<string, unknown>)) {
    return String((item as Record<string, unknown>)["id"]);
  }
  return String(item);
}

/** Percent-decode one URL activation-context segment, tolerating a malformed
 *  escape (a stray `%`) by returning the raw segment rather than throwing. */
function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/** Normalise a mount base-path to a leading-slash, no-trailing-slash form, or
 *  "" for the domain root — e.g. "/repo/" and "/repo" → "/repo"; "/" and
 *  undefined → "". Vite's BASE_URL ("/" or "/repo/") maps cleanly through here. */
function normalizeBase(base?: string): string {
  if (!base || base === "/") return "";
  const withLead = base.startsWith("/") ? base : `/${base}`;
  return withLead.endsWith("/") ? withLead.slice(0, -1) : withLead;
}

export class Router {
  private readonly byName = new Map<string, PageRoute>();
  private readonly byClass = new Map<PageClass, PageRoute>();
  private readonly mountEl: Element;
  private readonly indexRoute: string;
  /** The mount base-path, normalised (e.g. "/repo" or "" for the domain root). */
  private readonly basename: string;
  private current: Page | undefined;
  /** Increments per render. A render that finds a newer token started while it
   *  awaited (async onActivate / lifecycle / a locale re-fetch re-render) aborts
   *  before touching the DOM, so a stale render can't clobber a newer one. */
  private renderToken = 0;

  constructor(options: RouterOptions) {
    for (const route of options.routes) {
      this.byName.set(route.name.toLowerCase(), route);
      this.byClass.set(route.page, route);
    }
    this.mountEl = options.mount;
    this.indexRoute = (options.indexRoute ?? "index").toLowerCase();
    this.basename = normalizeBase(options.basename);
  }

  /** Drop the mount base-path from an address-bar pathname before route
   *  resolution, so the app sees "/view/5", not "/repo/view/5". A pathname that
   *  isn't under the base (shouldn't happen on a correctly-served site) is left
   *  as-is. */
  private stripBase(pathname: string): string {
    if (!this.basename) return pathname;
    if (pathname === this.basename) return "/";
    if (pathname.startsWith(`${this.basename}/`)) return pathname.slice(this.basename.length);
    return pathname;
  }

  /** Install navigation hooks, subscribe to back/forward, render the current URL. */
  start(): void {
    Navigation.installRouter({
      navigate: (target, context) => this.navigate(target, context),
      pathFor: (target, context) => this.pathFor(target, context),
    });
    window.addEventListener("popstate", () => {
      void this.renderFromLocation();
    });
    // A locale change has no fine-grained reactivity to lean on, so re-render the
    // current page: it re-runs every `${message:…}` against the new catalogue.
    Messages.onLocaleChange(() => {
      void this.renderFromLocation();
    });
    // Global backstop: catch stray errors the render boundaries can't see
    // (sync event-handler throws, timers, third-party) and feed them to the
    // reporter. Not page-render failures, so no error page.
    window.addEventListener("error", (e) =>
      ErrorReporter.report(e.error ?? e.message, { phase: "event", path: location.pathname }),
    );
    window.addEventListener("unhandledrejection", (e) =>
      ErrorReporter.report(e.reason, { phase: "event", path: location.pathname }),
    );
    void this.renderFromLocation();
    // Fetch the active locale's catalogue if it's provider-only (e.g. a persisted
    // locale not in the bundle); re-renders when it arrives.
    Messages.ensureActiveLoaded();
  }

  /** Programmatic navigation: push (or, for a redirect, replace) history + render. */
  navigate(target: unknown, context: unknown[] = [], replace = false): void {
    const route = this.routeFor(target);
    if (!route) {
      console.warn("qloom: no route for navigation target", target);
      return;
    }
    const ctx = context.map(ctxToString);
    const path = this.pathFor(route.name, ctx);
    if (path !== location.pathname) {
      if (replace) history.replaceState({}, "", path);
      else history.pushState({}, "", path);
    }
    void this.render(route, ctx);
  }

  pathFor(target: unknown, context: readonly unknown[] = []): string {
    const route = this.routeFor(target);
    const name = route ? route.name.toLowerCase() : String(target).toLowerCase();
    // Percent-encode each segment so a value containing a space, slash, `%`, or
    // other reserved character survives the round-trip (resolve decodes it).
    const ctx = context.map(ctxToString).filter((s) => s.length > 0).map(encodeURIComponent);
    const routeSeg = name === this.indexRoute ? "" : `/${name}`;
    const suffix = ctx.length ? `/${ctx.join("/")}` : "";
    // Prepend the mount base-path so generated hrefs and pushState targets stay
    // under the sub-path the app is served from (e.g. a Pages project site).
    return this.basename + (routeSeg + suffix || "/");
  }

  private routeFor(target: unknown): PageRoute | undefined {
    if (typeof target === "string") return this.byName.get(target.toLowerCase());
    if (typeof target === "function") return this.byClass.get(target as PageClass);
    if (target && typeof target === "object") {
      return this.byClass.get((target as object).constructor as PageClass);
    }
    return undefined;
  }

  private resolve(pathname: string): { route: PageRoute; context: string[] } | undefined {
    const segments = pathname.split("/").filter(Boolean);
    const name = (segments[0] ?? this.indexRoute).toLowerCase();
    // Percent-decode context segments (pathFor encoded them) so the page sees the
    // original value. The route name is a literal path token and is not decoded.
    const named = this.byName.get(name);
    if (named) return { route: named, context: segments.slice(1).map(decodeSegment) };
    const index = this.byName.get(this.indexRoute);
    return index ? { route: index, context: segments.map(decodeSegment) } : undefined;
  }

  private async renderFromLocation(): Promise<void> {
    const resolved = this.resolve(this.stripBase(location.pathname));
    if (!resolved) {
      console.warn("qloom: no route for", location.pathname);
      return;
    }
    await this.render(resolved.route, resolved.context);
  }

  /** Render boundary: a page-render failure is reported and replaced with the
   *  generic error page (Qloom's telemetry-first take on Tapestry's
   *  ExceptionReport), never leaking as an unhandled rejection. */
  private async render(route: PageRoute, context: string[]): Promise<void> {
    try {
      await this.renderPage(route, context);
    } catch (error) {
      ErrorReporter.report(error, {
        phase: "render",
        route: route.name,
        path: location.pathname,
        activationContext: context,
      });
      await ErrorReporter.renderErrorPage(this.mountEl);
    }
  }

  private async renderPage(route: PageRoute, context: string[]): Promise<void> {
    const token = ++this.renderToken; // this render's identity (see renderToken)
    const outgoing = this.current; // the page being replaced, captured before any await
    Navigation.notifyNavigation(); // one activation = one "request" (ages flash state)
    const page = new route.page();
    // @PageActivationContext fields are populated from the URL before onActivate,
    // so the handler (and render) see them.
    applyActivationContext(page, context);
    // Page lifecycle: loaded/attached fire once per navigation (Qloom re-instantiates
    // per nav — no page pool — so the two coincide), before onActivate. Await only a
    // genuinely async callback: a no-op/sync one must NOT defer onActivate past this
    // point (a page may do startup work there that `start()` sequences against).
    const loaded = invokeLifecycle(page, "pageLoaded");
    if (loaded) await loaded;
    const attached = invokeLifecycle(page, "pageAttached");
    if (attached) await attached;
    // onActivate may be async and may return a redirect target (page/name).
    const redirect = await page.onActivate?.(context);
    if (redirect != null) {
      // Redirect-after-activate: REPLACE the current entry so the redirecting
      // URL never becomes a back-button target — otherwise Back re-activates it,
      // it redirects forward again, and the user is trapped (e.g. Index→Signin).
      // (This page redirected before rendering, so no pageReset/pageDetached for it.)
      this.navigate(redirect, [], true);
      return;
    }
    if (token !== this.renderToken) return; // superseded during activate — abort, don't clobber

    // Detach the outgoing page (a teardown hook — clear timers/listeners) now that
    // it is actually being replaced. @PageReset fires after onActivate (so it sees
    // the activation context) and before render — the hook to reset persistent
    // (@Persist/@SessionState) state on a fresh visit.
    if (outgoing && outgoing !== page) {
      const detached = invokeLifecycle(outgoing, "pageDetached");
      if (detached) await detached;
    }
    const reset = invokeLifecycle(page, "pageReset");
    if (reset) await reset;
    if (token !== this.renderToken) return; // final gate before the (synchronous) mount below

    this.mountEl.replaceChildren();
    Zones.clear(); // the previous page's zone elements are gone; drop their registrations
    driveInstance(page, new DomMarkupWriter(this.mountEl), route.template);

    // onPassivate keeps the URL canonical; fall back to @PageActivationContext
    // fields when the page defines no explicit onPassivate.
    const passivated = page.onPassivate?.() ?? extractActivationContext(page);
    if (passivated) {
      // Pass raw values so pathFor's ctxToString coerces once (an { id } object
      // → its id). Pre-stringifying here with String() would corrupt objects to
      // "[object Object]" before ctxToString could encode them.
      const path = this.pathFor(route.name, passivated);
      if (path !== location.pathname) history.replaceState({}, "", path);
    }

    this.current = page;
  }
}
