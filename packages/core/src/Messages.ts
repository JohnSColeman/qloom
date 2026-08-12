import { ErrorReporter } from "./ErrorReporter.js";
import type { MessagesProvider } from "./types.js";

/**
 * Message catalogue for `${message:key}` expansions and `message:` bindings,
 * with runtime **locale switching**. Catalogues are registered per locale;
 * `message(key)` reads the active locale, falling back to the locale's base
 * language (`fr-FR` → `fr`) then the default locale then the key itself.
 *
 * The active locale is **persisted to `localStorage`** (the `@Persist('local')`
 * scope) so it survives reload — satisfying the reconstructability invariant
 * (PLAN §3): the page is rebuildable from the URL + persisted state. Changing it
 * (`setLocale`) notifies a listener — the Router registers one that re-renders
 * the current page, since Qloom has no fine-grained reactivity.
 *
 * Shared mutable state, so a static class (module architecture rule 2).
 */
export class Messages {
  private static catalogues: Record<string, Record<string, string>> = {};
  private static defaultLocale = "en";
  private static active: string | null = null; // lazily negotiated on first use
  private static listener: (() => void) | null = null;
  private static provider: MessagesProvider | null = null;
  private static readonly loaded = new Set<string>(); // locales whose catalogue is present
  private static announced: string[] | null = null; // offerable locales (for the selector)
  private static readonly STORAGE_KEY = "qloom.locale";

  /** Register entries for the **default** locale (back-compatible). */
  static configureMessages(catalogue: Record<string, string>): void {
    Messages.merge(Messages.defaultLocale, catalogue);
  }

  /** Register entries for a specific `locale` (e.g. "fr", "fr-FR"). */
  static configureLocale(locale: string, catalogue: Record<string, string>): void {
    Messages.merge(locale, catalogue);
  }

  /** Register a map of `locale → catalogue` at once — the shape the Vite plugin
   *  emits from consolidating the app's `.properties` files. The empty-string
   *  key means the default locale (the un-suffixed `*.properties` files). */
  static registerCatalogues(byLocale: Record<string, Record<string, string>>): void {
    for (const [locale, catalogue] of Object.entries(byLocale)) {
      Messages.merge(locale === "" ? Messages.defaultLocale : locale, catalogue);
    }
  }

  /** Set which locale is the fallback for missing keys (default "en"). */
  static setDefaultLocale(locale: string): void {
    Messages.defaultLocale = locale;
  }

  /** Wire a backend source for catalogues (lazy-load on switch + `reload`). */
  static configureProvider(provider: MessagesProvider): void {
    Messages.provider = provider;
  }

  /** Declare the offerable locales for the selector — needed when some are
   *  provider-loaded and not bundled, so they can be chosen before being fetched. */
  static announceLocales(locales: string[]): void {
    Messages.announced = [...locales];
  }

  /** The offerable locales: the announced list if set, else the registered ones. */
  static getAvailableLocales(): string[] {
    return Messages.announced ?? Object.keys(Messages.catalogues);
  }

  /** The active locale (negotiated from persisted value / `navigator.language`
   *  / default on first access). */
  static getLocale(): string {
    return Messages.ensureActive();
  }

  /** Switch the active locale: persist it, lazy-load its catalogue from the
   *  provider if it isn't present yet, then notify the listener (which re-renders
   *  the page). A no-op if already active. */
  static setLocale(locale: string): void {
    if (locale === Messages.active) return;
    Messages.active = locale;
    Messages.persist(locale);
    void Messages.load(locale).finally(() => Messages.listener?.());
  }

  /** Load the active locale's catalogue from the provider if it isn't present —
   *  called once at startup (the Router does this) so a persisted, provider-only
   *  locale is fetched on cold load. Re-renders once it arrives. */
  static ensureActiveLoaded(): void {
    const locale = Messages.ensureActive();
    if (Messages.loaded.has(locale) || !Messages.provider) return;
    void Messages.load(locale).finally(() => Messages.listener?.());
  }

  /** Re-fetch a locale's catalogue from the provider and merge it over the
   *  current one (server-side copy changed — a CMS edit), then re-render. */
  static async reload(locale: string = Messages.getLocale()): Promise<void> {
    if (!Messages.provider) return;
    try {
      Messages.merge(locale, await Messages.provider.fetch(locale));
      Messages.listener?.();
    } catch (error) {
      ErrorReporter.report(error, { phase: "messages", path: `reload:${locale}` });
    }
  }

  /** Look up a message by key: active locale → its base language → default
   *  locale → the key itself. */
  static message(key: string): string {
    const active = Messages.ensureActive();
    return (
      Messages.catalogues[active]?.[key] ??
      Messages.catalogues[Messages.baseOf(active)]?.[key] ??
      Messages.catalogues[Messages.defaultLocale]?.[key] ??
      key
    );
  }

  /** Register the callback fired when the active locale changes (one at a time —
   *  the Router installs one that re-renders the current page). */
  static onLocaleChange(fn: () => void): void {
    Messages.listener = fn;
  }

  // --- internals ---

  private static merge(locale: string, catalogue: Record<string, string>): void {
    Messages.catalogues[locale] = { ...(Messages.catalogues[locale] ?? {}), ...catalogue };
    Messages.loaded.add(locale); // registered or fetched → present
  }

  /** Fetch a locale from the provider once (deduped). No-op if already present
   *  or no provider. */
  private static async load(locale: string): Promise<void> {
    if (Messages.loaded.has(locale) || !Messages.provider) return;
    Messages.loaded.add(locale); // optimistic — dedupe concurrent switches
    try {
      Messages.merge(locale, await Messages.provider.fetch(locale));
    } catch (error) {
      Messages.loaded.delete(locale); // allow a retry
      ErrorReporter.report(error, { phase: "messages", path: `load:${locale}` });
    }
  }

  private static ensureActive(): string {
    if (Messages.active === null) Messages.active = Messages.negotiate();
    return Messages.active;
  }

  /** Persisted value → `navigator.language` (or its base) → default. Only picks
   *  a locale that actually has a catalogue. */
  private static negotiate(): string {
    // Honour a persisted choice even if not yet loaded — the provider can fetch it.
    const stored = Messages.read();
    if (stored) return stored;
    const nav = typeof navigator !== "undefined" ? navigator.language : "";
    for (const candidate of [nav, Messages.baseOf(nav)]) {
      if (candidate && Messages.has(candidate)) return candidate;
    }
    return Messages.defaultLocale;
  }

  private static has(locale: string): boolean {
    return Object.prototype.hasOwnProperty.call(Messages.catalogues, locale);
  }

  private static baseOf(locale: string): string {
    return locale.split(/[-_]/)[0] ?? locale;
  }

  private static persist(locale: string): void {
    try {
      localStorage.setItem(Messages.STORAGE_KEY, locale);
    } catch {
      /* storage unavailable — locale simply won't survive reload */
    }
  }

  private static read(): string | null {
    try {
      return localStorage.getItem(Messages.STORAGE_KEY);
    } catch {
      return null;
    }
  }
}
