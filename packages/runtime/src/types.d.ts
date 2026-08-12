/** Types for @qloom/runtime — the public authoring surface. */
import type { MarkupWriter } from "@qloom/core";

/**
 * The Tapestry render phases, all optional. A component overrides only the ones
 * it needs, either by these convention method names or via the annotations
 * (`@BeginRender` etc.). Return values control the render-phase state machine —
 * see the protocol in @qloom/core.
 */
export interface Lifecycle {
  setupRender?(writer: MarkupWriter): boolean | void;
  beginRender?(writer: MarkupWriter): boolean | void;
  /** Wraps template rendering. `false` suppresses the template (and its body);
   *  `afterRenderTemplate` still fires. */
  beforeRenderTemplate?(writer: MarkupWriter): boolean | void;
  beforeRenderBody?(writer: MarkupWriter): boolean | void;
  afterRenderBody?(writer: MarkupWriter): boolean | void;
  afterRenderTemplate?(writer: MarkupWriter): boolean | void;
  /** `false` re-runs from beginRender (Loop iterates this way); `null`/void advances. */
  afterRender?(writer: MarkupWriter): boolean | null | void;
  cleanupRender?(writer: MarkupWriter): void;
}

export interface ParameterOptions {
  required?: boolean;
  /** Tapestry `@Parameter(allowNull=…)` (default true). When false, a *bound*
   *  parameter that resolves to null/undefined throws on read (fail-loud),
   *  naming the component + parameter — rather than passing null downstream. An
   *  unbound parameter is ordinary storage, so the check does not apply to it. */
  allowNull?: boolean;
  /** Tapestry `@Parameter(defaultPrefix=…)` — how a *bare* (prefix-less) template
   *  value for this parameter is read. `"prop"` (the default) treats a bare
   *  single identifier as a property expression (`this.<id>`); `"literal"` treats
   *  it as the raw string. (An explicit `prop:`/`literal:`/`message:` prefix in
   *  the template always wins.) Only a bare single identifier is ambiguous and
   *  consults this — dotted paths, calls, and operators are always `prop`. */
  defaultPrefix?: "prop" | "literal";
  /** Tapestry `@Parameter(value=…)` — a default *binding expression* used when
   *  the parameter is left unbound (and has no field initializer). Unlike a plain
   *  field initializer it is a live expression with a prefix: `literal:x`,
   *  `message:key` (re-looked-up), or `prop:a.b` (read from the container); a bare
   *  expression uses this parameter's `defaultPrefix`. Evaluated at read time. */
  value?: string;
}

export interface OnEventOptions {
  /** The event name, e.g. "action", "success". */
  value: string;
  /** Restrict to a specific child component id (optional). */
  component?: string;
}

export interface SessionStateOptions {
  /**
   * When false, the SSO is in-memory only: still shared and surviving SPA
   * navigation, but never written to storage. Use for transient or sensitive
   * graphs (e.g. an in-progress booking with card data) that must not be
   * persisted in the browser. Default true.
   */
  persist?: boolean;
  /**
   * Tapestry's `create`. When false, reading the field does NOT create the SSO
   * (returns undefined if absent), and a companion `<name>Exists` boolean
   * property is defined to check existence without creating it. Default true.
   */
  create?: boolean;
}

export interface PersistOptions {
  /** A stable class key, overriding `constructor.name` — set this if your build
   *  minifies class names (which would otherwise change the storage key). */
  key?: string;
}

export type PersistScope = "session" | "local" | "flash";

/** Tapestry @Import: client-side assets a component/page depends on. Field names
 *  match Tapestry's annotation. module/esModule/stack reserved, ignored for now. */
export interface ImportSpec {
  stylesheet?: string[];
  library?: string[];
  module?: string[];
  esModule?: string[];
  stack?: string[];
}
