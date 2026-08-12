import { Page } from "@qloom/runtime";
import { Messages } from "@qloom/core";

// A mock "backend" catalogue: `de` is provider-only (lazy-loaded on switch);
// each `en` fetch returns a fresh apiGreeting so reload() proves a live re-fetch.
// (A real app configures the provider once in main.ts; this fixture does it in
// onActivate to keep its global state from leaking into the other locale demo.)
let calls = 0;
const remote = (locale: string): Record<string, string> =>
  locale === "de" ? { apiGreeting: "Aus der API" } : { apiGreeting: `API call ${++calls}` };

export class MessagesApiDemo extends Page {
  override onActivate(): void {
    Messages.announceLocales(["en", "de"]); // offer `de` though it isn't bundled
    Messages.configureProvider({ fetch: (locale) => Promise.resolve(remote(locale)) });
  }

  onReload(): void {
    void Messages.reload(); // re-fetch the active locale (CMS-style override)
  }
}
