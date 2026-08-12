import { Component } from "./Component.js";

/**
 * A page is a routable component. `onActivate` receives the URL activation
 * context; `onPassivate` returns the state that must survive as URL.
 */
export abstract class Page extends Component {
  /** Called on navigation with the URL activation context. May be async, and
   *  may return a redirect target (a page class/name) — Tapestry semantics. */
  onActivate?(context: readonly string[]): unknown | Promise<unknown>;
  /** Returns the state to encode as URL context. Values may be objects with an
   *  `id` (encoded via the router's ValueEncoder analogue), not just strings. */
  onPassivate?(): readonly unknown[] | undefined;
}
