import { COMPONENT_ID } from "@qloom/core";
import { SessionStore } from "./SessionStore.js";
import type { PersistScope, PersistOptions } from "./types.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Persists a field across reloads/navigations, keyed by class + component id +
 * field (mirroring Tapestry's page:component:field), backed by the same
 * encrypted, in-memory-cached store as `@SessionState`. Scopes: `'session'`,
 * `'local'`, and `'flash'` (survives exactly one activation, then discarded).
 * Values are Proxy-wrapped, so nested mutations re-persist and identity is stable
 * across reads. Declare @Persist fields **without an initializer** (Tapestry:
 * the unset value is the default) — an initializer would overwrite the stored
 * value on every construction. Not for real secrets — see the encryption caveat
 * in `SessionStore.ts`.
 */
export function Persist(scope: PersistScope = "session", options: PersistOptions = {}) {
  const stableClass = options.key;
  return function (target: object, key: string | symbol): void {
    const field = String(key);
    Object.defineProperty(target, key, {
      configurable: true,
      enumerable: true,
      get(this: any) {
        const className = stableClass ?? this.constructor.name;
        return SessionStore.getPersist(scope, className, String(this[COMPONENT_ID] ?? ""), field);
      },
      set(this: any, value: unknown) {
        const className = stableClass ?? this.constructor.name;
        SessionStore.setPersist(scope, className, String(this[COMPONENT_ID] ?? ""), field, value);
      },
    });
  };
}
