import type { ErrorReporterOptions, QloomErrorContext } from "./types.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * The internal error-reporting API. Runtime errors caught at Qloom's render
 * boundaries (Router, Zones) and the global backstop are funnelled here.
 *
 * Default sink is `console.error`; an app attaches a telemetry SDK via
 * `configure({ report })`. Shared mutable state, so a static class (module
 * architecture rule 4). This is Qloom's deliberate replacement for Tapestry's
 * server-rendered ExceptionReport: errors are *observed* via telemetry, and a
 * page-render failure shows a generic error page (embedded default here; the
 * `/error.html` convention is a planned follow-up).
 */
export class ErrorReporter {
  private static options: ErrorReporterOptions = {};
  private static readonly seen = new WeakSet<object>();
  /** Cached `/error.html`: undefined = not fetched, null = none (use embedded),
   *  string = the fetched markup. */
  private static errorPageHtml: string | null | undefined = undefined;

  static configure(options: ErrorReporterOptions): void {
    ErrorReporter.options = { ...ErrorReporter.options, ...options };
    if ("errorPage" in options) ErrorReporter.errorPageHtml = undefined; // re-resolve
  }

  /** Report a runtime error with its context. Deduplicates (an error object is
   *  reported once, even if boundary + backstop both see it) and samples. */
  static report(error: unknown, context: QloomErrorContext): void {
    if (typeof error === "object" && error !== null) {
      if (ErrorReporter.seen.has(error)) return;
      ErrorReporter.seen.add(error);
    }
    const { report, sampleRate, scrub } = ErrorReporter.options;
    if (typeof sampleRate === "number" && sampleRate < 1 && !ErrorReporter.sampled(sampleRate)) {
      return;
    }
    const ctx = scrub ? scrub(context) : context;
    try {
      if (report) {
        report(error, ctx);
      } else {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[qloom] ${ctx.phase} error: ${message}`, ctx, error);
      }
    } catch (sinkError) {
      // A telemetry sink must never take down the app.
      console.error("[qloom] error reporter threw", sinkError);
    }
  }

  /** Render the generic error page into the mount after a page-render failure:
   *  the app-provided `/error.html` (convention) if present, else the embedded
   *  default. Never throws (guards against a recursive failure). */
  static async renderErrorPage(mount: Element): Promise<void> {
    try {
      const html = await ErrorReporter.resolveErrorPage();
      if (html !== null) {
        mount.innerHTML = html; // app-authored /error.html — self-contained body markup
      } else {
        ErrorReporter.renderEmbeddedErrorPage(mount);
      }
    } catch (renderError) {
      console.error("[qloom] failed to render error page", renderError);
      try {
        ErrorReporter.renderEmbeddedErrorPage(mount);
      } catch {
        /* give up — never loop */
      }
    }
  }

  /** Fetch (once) the app-root `/error.html`; null when absent or disabled.
   *
   *  The content is accepted only if it carries the `data-qloom-error` marker.
   *  This is essential, not cosmetic: a host that rewrites every unknown path to
   *  index.html (Vite dev, nginx `try_files … /index.html`) returns the app
   *  shell with a 200 for a *missing* `/error.html`, so `res.ok` alone would
   *  inject the whole app as the error page. The marker distinguishes a real
   *  error page (which the app author tags) from the SPA fallback. */
  private static async resolveErrorPage(): Promise<string | null> {
    const configured = ErrorReporter.options.errorPage;
    if (configured === false) return null; // embedded only
    if (ErrorReporter.errorPageHtml !== undefined) return ErrorReporter.errorPageHtml; // cached
    const url = typeof configured === "string" ? configured : "/error.html";
    try {
      const res = await fetch(url, { headers: { accept: "text/html" } });
      const text = res.ok ? await res.text() : "";
      ErrorReporter.errorPageHtml = text.includes("data-qloom-error") ? text : null;
    } catch {
      ErrorReporter.errorPageHtml = null; // network failure → embedded
    }
    return ErrorReporter.errorPageHtml;
  }

  /** The built-in fallback error page (inline styles, so it shows without app CSS). */
  private static renderEmbeddedErrorPage(mount: Element): void {
    mount.replaceChildren();
    const box = mount.ownerDocument.createElement("div");
    box.setAttribute("role", "alert");
    box.setAttribute("data-qloom-error", "");
    box.setAttribute(
      "style",
      "max-width:32rem;margin:4rem auto;padding:1.5rem 2rem;border:1px solid #e0b4b4;" +
        "border-radius:8px;background:#fff6f6;color:#5c1a1a;font-family:system-ui,sans-serif;text-align:center;",
    );
    const h = box.ownerDocument.createElement("h1");
    h.textContent = "Something went wrong";
    h.setAttribute("style", "font-size:1.25rem;margin:0 0 .5rem;");
    const p = box.ownerDocument.createElement("p");
    p.textContent = "An unexpected error occurred. Please try again.";
    p.setAttribute("style", "margin:0 0 1rem;");
    const btn = box.ownerDocument.createElement("button");
    btn.textContent = "Reload";
    btn.setAttribute(
      "style",
      "padding:.4rem 1rem;border:1px solid #c9807f;border-radius:6px;background:#fff;cursor:pointer;",
    );
    btn.addEventListener("click", () => location.reload());
    box.append(h, p, btn);
    mount.append(box);
  }

  /** Deterministic-free sampling. Math.random is unavailable in some sandboxes
   *  but present in the browser runtime this only ever runs in. */
  private static sampled(rate: number): boolean {
    return Math.random() < rate;
  }
}
