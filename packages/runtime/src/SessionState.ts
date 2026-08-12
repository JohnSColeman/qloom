import { SessionStore } from "./SessionStore.js";
import { registerProperty } from "./registerProperty.js";
import type { SessionStateOptions } from "./types.js";

/**
 * Tapestry's `@SessionState`. Backs the field with a session state object (SSO)
 * that is **shared across pages by its class** — keyed by `ctor.name`, mirroring
 * Tapestry's `ssoClass.getName()`. The SSO is auto-created via `new ctor()`
 * (Tapestry's `create=true`), held in an in-memory registry (survives SPA
 * navigation) and, unless `persist:false`, mirrored to encrypted `sessionStorage`
 * (survives reload). See `SessionStore.ts` for the encryption caveat.
 *
 * Pass the SSO **class** (not a factory), so declare the field without an
 * initializer: `@SessionState(SearchCriteria) criteria!: SearchCriteria`.
 */
export function SessionState<T>(ctor: new () => T, options: SessionStateOptions = {}) {
  SessionStore.registerSso(ctor, options.persist !== false);
  const create = options.create !== false;
  return function (target: object, key: string): void {
    registerProperty(target, key); // also bindable, like Tapestry's @SessionState @Property
    Object.defineProperty(target, key, {
      configurable: true,
      enumerable: true,
      get(): T | undefined {
        return create ? SessionStore.getSessionState(ctor) : SessionStore.getSessionStateIfExists(ctor);
      },
      set(value: T): void {
        SessionStore.setSessionState(ctor, value);
      },
    });
    if (!create) {
      // Tapestry's companion `<name>Exists` — check without creating the SSO.
      Object.defineProperty(target, `${key}Exists`, {
        configurable: true,
        enumerable: true,
        get(): boolean {
          return SessionStore.hasSessionState(ctor);
        },
      });
    }
  };
}
