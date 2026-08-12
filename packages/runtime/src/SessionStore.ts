/**
 * Client-side persistence backing both `@SessionState` (SSOs) and `@Persist`
 * (fields).
 *
 * Everything lives in an in-memory cache (synchronous access during render) and
 * is mirrored to browser storage as **encrypted** blobs (AES-GCM via Web Crypto):
 *   - `qloom:sso`             (sessionStorage) — `@SessionState` objects
 *   - `qloom:persist:session` (sessionStorage) — `@Persist('session')` fields
 *   - `qloom:persist:local`   (localStorage)   — `@Persist('local')` fields
 *
 * Each blob is one encrypted JSON object. Values are Proxy-wrapped so nested
 * mutations re-persist and identity stays stable across reads. Because
 * encryption is asynchronous, call {@link SessionStore.initPersistence} once at
 * startup (await it before the first render) to hydrate the cache.
 *
 * ENCRYPTION CAVEAT: client-side encryption cannot hide data from the user whose
 * own browser holds the key (derived from an in-code passphrase). It provides
 * at-rest obfuscation and tamper-evidence (a mangled blob fails to decrypt and is
 * dropped), NOT confidentiality against the user. Never put a real secret in
 * client state — a browser-only app has nowhere to hide one.
 *
 * Shared mutable state, so a static class (module architecture rule 2).
 */
import { Navigation } from "@qloom/core";
import type { PersistScope } from "./types.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

const PASSPHRASE = "qloom-session-state-v1"; // not a secret — see the caveat above

const SSO = "sso:";
const P_SESSION = "persist:session:";
const P_LOCAL = "persist:local:";
const P_FLASH = "flash:"; // in-memory only; aged out one activation after being read

/** Each blob is one encrypted object in one storage, owning a key namespace. */
interface Blob {
  name: string;
  storage: () => Storage | undefined;
  owns: (fqKey: string) => boolean;
}

export class SessionStore {
  private static readonly cache = new Map<string, any>(); // fqKey → live (Proxy-wrapped) value
  private static readonly inMemoryOnly = new Set<string>(); // fqKeys never written to storage
  private static readonly ssoCtors = new Map<string, new () => any>(); // sso name → class (create + revive)

  // flash: @Persist('flash') survives exactly one activation boundary.
  private static flashGen = 0;
  private static readonly flashWrittenAt = new Map<string, number>();

  private static readonly blobs: Blob[] = [
    { name: "qloom:sso", storage: () => SessionStore.sessionStore(), owns: (k) => k.startsWith(SSO) },
    { name: "qloom:persist:session", storage: () => SessionStore.sessionStore(), owns: (k) => k.startsWith(P_SESSION) },
    { name: "qloom:persist:local", storage: () => SessionStore.localStore(), owns: (k) => k.startsWith(P_LOCAL) },
  ];

  private static flushScheduled = false;
  private static keyPromise: Promise<CryptoKey> | undefined;

  static {
    // one activation = one "request": age flash state.
    Navigation.onNavigation(() => SessionStore.ageFlash());
  }

  // --- @SessionState accessors ----------------------------------------------

  /** Register an SSO class so it can be created (`new ctor()`, Tapestry's
   *  create=true) and revived to its class on reload. `persist=false` keeps it
   *  in-memory only (shared + survives SPA nav, but never written to storage). */
  static registerSso(ctor: new () => unknown, persist: boolean): void {
    SessionStore.ssoCtors.set(ctor.name, ctor);
    if (!persist) SessionStore.inMemoryOnly.add(SSO + ctor.name);
  }

  static getSessionState<T>(ctor: new () => T): T {
    const fq = SSO + ctor.name;
    if (!SessionStore.cache.has(fq)) {
      SessionStore.cache.set(fq, SessionStore.wrap(new ctor(), !SessionStore.inMemoryOnly.has(fq)));
    }
    return SessionStore.cache.get(fq);
  }

  static setSessionState<T>(ctor: new () => T, value: T): void {
    const fq = SSO + ctor.name;
    const persist = !SessionStore.inMemoryOnly.has(fq);
    SessionStore.cache.set(fq, SessionStore.wrap(value, persist));
    if (persist) SessionStore.scheduleFlush();
  }

  /** `create=false`: read without creating (Tapestry). */
  static getSessionStateIfExists<T>(ctor: new () => T): T | undefined {
    return SessionStore.cache.get(SSO + ctor.name);
  }

  /** Backs the `<name>Exists` companion — whether the SSO has been created. */
  static hasSessionState(ctor: new () => unknown): boolean {
    return SessionStore.cache.has(SSO + ctor.name);
  }

  // --- @Persist accessors ---------------------------------------------------

  static getPersist(scope: PersistScope, className: string, componentId: string, field: string): unknown {
    return SessionStore.cache.get(SessionStore.persistKey(scope, className, componentId, field));
  }

  static setPersist(
    scope: PersistScope,
    className: string,
    componentId: string,
    field: string,
    value: unknown,
  ): void {
    const fq = SessionStore.persistKey(scope, className, componentId, field);
    SessionStore.cache.set(fq, SessionStore.wrap(value, scope !== "flash"));
    if (scope === "flash") SessionStore.flashWrittenAt.set(fq, SessionStore.flashGen);
    else SessionStore.scheduleFlush();
  }

  // --- hydrate / clear ------------------------------------------------------

  /** Hydrate the cache from the encrypted blobs. Await before the first render
   *  (e.g. in `main.ts`) so restored `@SessionState`/`@Persist` state is present. */
  static async initPersistence(): Promise<void> {
    if (!SessionStore.subtle()) return;
    for (const blob of SessionStore.blobs) {
      const storage = blob.storage();
      if (!storage) continue;
      const raw = storage.getItem(blob.name);
      if (!raw) continue;
      try {
        const obj = JSON.parse(await SessionStore.decrypt(raw)) as Record<string, unknown>;
        for (const [fq, v] of Object.entries(obj)) {
          // Revive SSOs to their class so methods/identity survive the reload.
          if (fq.startsWith(SSO)) {
            const ctor = SessionStore.ssoCtors.get(fq.slice(SSO.length));
            const revived = ctor && v && typeof v === "object" ? Object.assign(new ctor(), v) : v;
            SessionStore.cache.set(fq, SessionStore.wrap(revived, !SessionStore.inMemoryOnly.has(fq)));
          } else {
            SessionStore.cache.set(fq, SessionStore.wrap(v, true));
          }
        }
      } catch {
        storage.removeItem(blob.name); // corrupt/tampered (GCM auth failed) → drop it
      }
    }
  }

  /** Back-compat alias (some apps call this name). */
  static initSessionState(): Promise<void> {
    return SessionStore.initPersistence();
  }

  /**
   * Clear session-scoped state — the browser analogue of Tapestry's session
   * invalidation on logout. Drops all SSOs and `@Persist('session')` fields (and
   * their blobs); `@Persist('local')` is left intact.
   */
  static clearSession(): void {
    for (const k of [...SessionStore.cache.keys()]) {
      if (k.startsWith(SSO) || k.startsWith(P_SESSION) || k.startsWith(P_FLASH)) SessionStore.cache.delete(k);
    }
    SessionStore.flashWrittenAt.clear();
    SessionStore.sessionStore()?.removeItem("qloom:sso");
    SessionStore.sessionStore()?.removeItem("qloom:persist:session");
  }

  /** Back-compat alias. */
  static clearSessionState(): void {
    SessionStore.clearSession();
  }

  // --- internals ------------------------------------------------------------

  /** Called once per page activation (Tapestry's "request"): a flash value written
   *  at generation G is readable at G and G+1, then discarded. */
  private static ageFlash(): void {
    SessionStore.flashGen++;
    for (const [k, g] of SessionStore.flashWrittenAt) {
      if (SessionStore.flashGen - g > 1) {
        SessionStore.cache.delete(k);
        SessionStore.flashWrittenAt.delete(k);
      }
    }
  }

  private static sessionStore(): Storage | undefined {
    return (globalThis as any).sessionStorage;
  }
  private static localStore(): Storage | undefined {
    return (globalThis as any).localStorage;
  }
  private static subtle(): SubtleCrypto | undefined {
    return (globalThis as any).crypto?.subtle;
  }

  /** Proxy-wrap objects so nested mutations schedule a re-persist. */
  private static wrap<T>(value: T, persist: boolean): T {
    if (value === null || typeof value !== "object") return value;
    return new Proxy(value as any, {
      set(target, prop, v) {
        const ok = Reflect.set(target, prop, v);
        if (persist) SessionStore.scheduleFlush();
        return ok;
      },
      deleteProperty(target, prop) {
        const ok = Reflect.deleteProperty(target, prop);
        if (persist) SessionStore.scheduleFlush();
        return ok;
      },
    });
  }

  private static persistPrefix(scope: PersistScope): string {
    return scope === "local" ? P_LOCAL : scope === "flash" ? P_FLASH : P_SESSION;
  }

  /** Keyed by class + component id + field (Tapestry: page:component:field). */
  private static persistKey(scope: PersistScope, className: string, componentId: string, field: string): string {
    return `${SessionStore.persistPrefix(scope)}${className}#${componentId}.${field}`;
  }

  private static scheduleFlush(): void {
    if (SessionStore.flushScheduled || !SessionStore.subtle()) return;
    SessionStore.flushScheduled = true;
    setTimeout(() => {
      SessionStore.flushScheduled = false;
      void SessionStore.flushNow();
    }, 0); // debounce a burst of mutations into one write
  }

  private static async flushNow(): Promise<void> {
    for (const blob of SessionStore.blobs) {
      const storage = blob.storage();
      if (!storage || !SessionStore.subtle()) continue;
      const entries = [...SessionStore.cache.entries()].filter(
        ([k]) => blob.owns(k) && !SessionStore.inMemoryOnly.has(k),
      );
      try {
        if (entries.length === 0) storage.removeItem(blob.name);
        else storage.setItem(blob.name, await SessionStore.encrypt(JSON.stringify(Object.fromEntries(entries))));
      } catch {
        /* best-effort: a persist failure must never break the app */
      }
    }
  }

  // --- Web Crypto AES-GCM ---------------------------------------------------

  private static cryptoKey(): Promise<CryptoKey> {
    if (!SessionStore.keyPromise) {
      const enc = new TextEncoder();
      SessionStore.keyPromise = (async () => {
        const crypto = (globalThis as any).crypto as Crypto;
        const base = await crypto.subtle.importKey("raw", enc.encode(PASSPHRASE), "PBKDF2", false, [
          "deriveKey",
        ]);
        return crypto.subtle.deriveKey(
          { name: "PBKDF2", salt: enc.encode("qloom:sso:salt"), iterations: 100_000, hash: "SHA-256" },
          base,
          { name: "AES-GCM", length: 256 },
          false,
          ["encrypt", "decrypt"],
        );
      })();
    }
    return SessionStore.keyPromise;
  }

  private static toB64(bytes: Uint8Array): string {
    let s = "";
    for (const b of bytes) s += String.fromCharCode(b);
    return btoa(s);
  }
  private static fromB64(s: string): Uint8Array {
    return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  }

  private static async encrypt(plain: string): Promise<string> {
    const crypto = (globalThis as any).crypto as Crypto;
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await SessionStore.cryptoKey();
    const data = new TextEncoder().encode(plain) as unknown as BufferSource;
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
    return `${SessionStore.toB64(iv)}.${SessionStore.toB64(new Uint8Array(ct))}`; // iv.ciphertext, both base64
  }

  private static async decrypt(blob: string): Promise<string> {
    const crypto = (globalThis as any).crypto as Crypto;
    const [ivB64, ctB64] = blob.split(".");
    const key = await SessionStore.cryptoKey();
    const iv = SessionStore.fromB64(ivB64 ?? "") as unknown as BufferSource;
    const ct = SessionStore.fromB64(ctB64 ?? "") as unknown as BufferSource;
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    return new TextDecoder().decode(pt);
  }
}
