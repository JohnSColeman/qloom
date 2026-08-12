# @qloom/router

URL ↔ page resolution for Qloom, and the `onActivate`/`onPassivate` two-way
binding that keeps a single-page app **bookmarkable and reload-safe**. This is the
package that enforces Qloom's reconstructability invariant (PLAN §3): a page is
reconstructed from **(URL activation context) + (`@Persist` storage) + (backend
API)** — never from in-memory state alone, so the back button, reload, and deep
links stay correct.

## Use

Wire routes and start the router in your app's `main.ts`:

```ts
import { Router } from "@qloom/router";

new Router({
  routes: [{ name: "index", page: IndexPage, template: IndexTemplate }],
  mount: document.getElementById("app")!,
  indexRoute: "index",
}).start();
```

## What it does

- **Route resolution** — maps a URL path to a `PageRoute` (`{ name, page,
  template }`) and mounts the page through [`@qloom/core`](../core).
- **Activation-context binding** — reads the URL's activation context into the
  page (`onActivate` / `@PageActivationContext`) on entry, and writes the page's
  navigational state back to the URL (`onPassivate`) — Tapestry's two-way page
  activation, ported.
- **History binding** — pushState/popstate handling so navigation, the back
  button, and reload all round-trip through the same URL-driven reconstruction.
- **Render boundary** — wraps each page render; a caught error is reported to
  `@qloom/core`'s `ErrorReporter`, and a page-render failure yields a generic
  error page (see the root [README](../../README.md#error-handling)).

## API

- **`Router`** — the class above (`RouterOptions` in `types.d.ts`).
- **`PageClass` / `PageRoute` / `RouterOptions`** — the public types.

Resolves to **source** (`src/index.ts`). Depends on [`@qloom/core`](../core) and
[`@qloom/runtime`](../runtime). See [CLAUDE.md](../../CLAUDE.md) and PLAN §4.
