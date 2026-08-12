/** Types for @qloom/core — the engine spine. */

export interface MarkupWriter {
  element(tag: string): void;
  attribute(name: string, value: string): void;
  text(value: string): void;
  /** Append unfiltered markup at the cursor (used by OutputRaw). */
  raw(html: string): void;
  end(): void;
  /** The currently-open element (DOM writers only; null under SSR). */
  currentElement(): Element | null;
}

export type RenderProgram<T = unknown> = (
  instance: T,
  writer: MarkupWriter,
  body?: RenderBody,
) => void;

export type RenderBody = (writer: MarkupWriter) => void;

/** Supplies message catalogues from a backend at runtime — the seam behind
 *  lazy-loading a locale on switch and live `Messages.reload()` (CMS-driven copy).
 *  `fetch(locale)` resolves the `key → value` catalogue for that locale. */
export interface MessagesProvider {
  fetch(locale: string): Promise<Record<string, string>>;
}

export interface Binding<T = unknown> {
  get(): T;
  set?(value: T): void;
}

export interface ComponentDefinition {
  ctor: new () => object;
  template?: RenderProgram;
}

export interface RouterHooks {
  navigate(target: unknown, context?: unknown[]): void;
  pathFor(target: unknown, context?: unknown[]): string;
}

export interface MountOptions {
  mount: Element;
}

/** Structured context accompanying a reported runtime error. */
export interface QloomErrorContext {
  phase: "activate" | "render" | "passivate" | "zone" | "event" | "messages";
  route?: string;
  path?: string; // location.pathname
  activationContext?: readonly string[];
  zoneId?: string;
  componentType?: string;
  componentId?: string;
}

/** App-supplied error-reporting configuration (see `ErrorReporter`). */
export interface ErrorReporterOptions {
  /** Custom sink (e.g. Sentry) — replaces the default `console.error`. */
  report?(error: unknown, context: QloomErrorContext): void;
  /** Fraction of errors to report, 0..1 (default 1). */
  sampleRate?: number;
  /** Strip/redact PII from the context before it leaves the browser. */
  scrub?(context: QloomErrorContext): QloomErrorContext;
  /**
   * The generic error page shown on a page-render failure. By convention Qloom
   * fetches `/error.html` from the app root (lazily, on the first error); if
   * absent (404) the embedded default is used. Set a different path here, or
   * `false` to always use the embedded page (e.g. on a host that rewrites every
   * unknown path to index.html, where a missing `/error.html` would 200 the app
   * shell instead of 404ing).
   */
  errorPage?: string | false;
}
