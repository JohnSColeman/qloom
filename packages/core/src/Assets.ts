import { IMPORTS } from "./symbols.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface ImportSpecLike {
  stylesheet?: string[];
  library?: string[];
}

/**
 * Client-side analogue of Tapestry's JavaScriptSupport: processes @Import
 * metadata by injecting <link>/<script> into document.head at render time,
 * deduped by resolved URL. Ported targets: stylesheet + library. Runs from
 * driveInstance before setupRender — Tapestry's SetupRender timing.
 */
export class Assets {
  // Injected-URL dedup set. Process-global and intentionally NOT reset on SPA
  // navigation: a shared Layout's assets inject once for the document lifetime.
  // (Tapestry re-loads assets per full page render; Qloom keeps them.) A future
  // page-specific @Import stylesheet would therefore persist across routes.
  private static injected = new Set<string>();
  private static contextRoot = "";

  /** Optional: base for `context:` paths (default ""). Mirrors Data.configureData.
   *  Set it to the app's mount base-path (e.g. Vite's `import.meta.env.BASE_URL`,
   *  trailing slash trimmed) so `context:`/`asset:` URLs resolve under a
   *  sub-path deployment such as a GitHub Pages project site. */
  static configure(options: { contextRoot?: string }): void {
    if (options.contextRoot != null) Assets.contextRoot = options.contextRoot;
  }

  /** Resolve a context-root-relative asset path (a `context:`/`asset:` target,
   *  minus its prefix) to a URL under the configured `contextRoot`. Compiled
   *  templates call this for `${context:…}` / `${asset:…}` expansions, and
   *  `@Import` uses it for its stylesheet/library targets. Default contextRoot ""
   *  ⇒ the path is unchanged, so root-mounted apps behave exactly as before. */
  static contextPath(path: string): string {
    const p = path.startsWith("/") ? path : `/${path}`;
    return `${Assets.contextRoot}${p}`;
  }

  /** Test isolation: forget what has been injected. */
  static reset(): void {
    Assets.injected.clear();
  }

  /** Read @Import metadata off the instance's prototype chain and inject. */
  static process(instance: object): void {
    for (let p = Object.getPrototypeOf(instance); p; p = Object.getPrototypeOf(p)) {
      if (!Object.prototype.hasOwnProperty.call(p, IMPORTS)) continue;
      const spec = (p as any)[IMPORTS] as ImportSpecLike;
      for (const raw of spec.stylesheet ?? []) Assets.inject(raw, "stylesheet", instance);
      for (const raw of spec.library ?? []) Assets.inject(raw, "library", instance);
    }
  }

  private static inject(raw: unknown, kind: "stylesheet" | "library", instance: object): void {
    if (typeof raw !== "string" || raw.trim() === "") {
      console.warn(`[qloom] @Import: ignoring empty/invalid ${kind} on ${instance.constructor.name}`);
      return;
    }
    const url = Assets.resolve(raw, instance);
    if (url === null) return; // unsupported prefix — already warned
    if (Assets.injected.has(url)) return;
    Assets.injected.add(url);
    if (kind === "stylesheet") {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      document.head.appendChild(link);
    } else {
      const script = document.createElement("script");
      script.src = url;
      document.head.appendChild(script);
    }
  }

  private static resolve(raw: string, instance: object): string | null {
    if (raw.startsWith("context:")) {
      return Assets.contextPath(raw.slice("context:".length));
    }
    // A URI scheme we don't support (classpath:, asset:, typos, …) has no
    // browser equivalent — warn and skip rather than emit a dead href.
    // http/https/data/file URLs and scheme-less paths pass through unchanged.
    const scheme = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(raw);
    if (scheme && !["http", "https", "data", "file"].includes(scheme[1]!.toLowerCase())) {
      console.warn(
        `[qloom] @Import: unsupported asset prefix in "${raw}" on ${instance.constructor.name}; skipped`,
      );
      return null;
    }
    return raw; // http(s)/data/file URL, or a scheme-less path — pass through
  }
}
