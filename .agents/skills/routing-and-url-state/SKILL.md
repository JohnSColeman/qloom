---
name: routing-and-url-state
description: "Routing and URL state in Qloom — the Router and route table, the onActivate/onPassivate two-way URL binding, single- and multi-segment activation context, PageLink and imperative Navigation.navigate, and reconstructable state via @Persist and @SessionState. Use when setting up routes, wiring navigation, passing state from one page to another, or making a page bookmarkable/reload-safe — and instead of a global/static store or 'intent' singleton to carry state between pages."
---

# Routing and URL State

Qloom's headline feature is that pages are **reconstructable from the URL** plus persistent storage
plus the backend — never from in-memory state alone. This is what makes back/forward, reload, and
deep-link Just Work. This skill covers the `Router`, the `onActivate`/`onPassivate` URL contract, and
the `@Persist`/`@SessionState` storage decorators.

> **The invariant:** a page must be fully reconstructable from **(URL activation context) +
> (`@Persist`/`@SessionState` storage) + (backend API)**. Design every page to honour it.

## Passing state between pages — the URL, not a side channel

When one page hands state to another — a listing's "Reviews" link opening the PDP's Reviews tab,
a chosen sort carried onto the next view — the channel is the **activation context** (or `@Persist`
/`@SessionState`), **never an in-memory global**.

> **Anti-pattern — the side-channel store.** A module-level singleton / static store / bespoke
> "intent" service (`PdpTabIntent`, `SelectedThingStore`) that page A writes and page B reads in
> `onActivate`. It's in-memory state with **no page boundary**, so it breaks the invariant: a reload
> or deep link can't restore it, and you inherit a "did the next navigation consume the stale value?"
> hazard. **If you're about to add a `SomethingIntent`/`…Store` to move a value between pages, stop**
> — the value is navigational state; put it in the URL.

| To carry, page → page… | Encode it as… |
|---|---|
| which tab / sub-view the next page opens | a trailing context segment (see *Multi-segment context* below) |
| a selection/flag that must survive reload | `@Persist` (scope `session`/`local`/`flash`) |
| the logged-in user / an in-progress graph | `@SessionState` |

## The route table

Routes are declared in `main.ts`, each mapping a name to a page class and its compiled template:

```ts
new Router({
  routes: [
    { name: "index",  page: Index,  template: indexTemplate },
    { name: "view",   page: View,   template: viewTemplate },
    { name: "book",   page: Book,   template: bookTemplate },
  ],
  mount: document.querySelector("#app")!,
  indexRoute: "index",
}).start();
```

- The route `name` is the **first URL segment**: `view` → `/view`, `/view/42`. Matching is case-insensitive.
- `indexRoute` maps to `/` (its name is not shown in the path).
- Trailing segments become the **activation context**: `/view/42` → `["42"]`. Unknown first segments fall through to the index route with the whole path as context.
- `start()` installs the navigation hooks, subscribes to `popstate` (back/forward), and renders the current URL.

### Deploying under a sub-path (`basename`)

When the app isn't served from the domain root — a **GitHub Pages project site** at
`/<repo>/`, a reverse-proxy prefix — pass `basename` so the History-API URLs stay
clean under the prefix. The router strips it when reading the address bar and
prepends it to every generated path and `PageLink` href:

```ts
new Router({
  routes: [ /* … */ ],
  mount: document.querySelector("#app")!,
  basename: import.meta.env.BASE_URL, // Vite's build-time base ("/" in dev, "/repo/" on Pages)
}).start();
```

Set Vite's `base` to match at build time (`vite build --base /repo/`, or a `BASE_PATH`
env in your config). Static hosts without SPA fallback (GitHub Pages) also need a
`404.html` copy of `index.html` so a deep-link or reload boots the app — see the
reference app's `vite.config.ts` and `.github/workflows/pages.yml`.

## `onActivate(context)` — reconstruct the page from the URL

Called when the router resolves the route, with the trailing path segments. **May be async** (fetch
here) and **may return a redirect** (a route name or page class):

```ts
export class View extends Page {
  @Property hotel: Hotel | null = null;
  override async onActivate(ctx: readonly string[]): Promise<void> {
    this.hotel = await bookingApi.getHotel({ id: Number(ctx[0]) });
  }
}

export class Index extends Page {
  override onActivate(): unknown {
    return authenticator.isLoggedIn() ? "search" : "signin";   // redirect
  }
}
```

Everything the page shows should be derivable here from `ctx` + storage + API — so a cold reload of
`/view/42` rebuilds the identical page.

A redirect returned from `onActivate` navigates with **`replaceState`** (redirect-after semantics),
so the redirecting URL doesn't become a back-button target — you can't get trapped bouncing through
a guard page like `Index → Signin`.

If `onActivate` or the render **throws**, the router reports it via `ErrorReporter` (default
`console.error`; configurable to a telemetry SDK) and shows a generic error page in the mount instead
of leaking an unhandled rejection. Drop an `error.html` (with a `data-qloom-error` marker) in the app
root to replace the built-in page. See the README "Error handling" section.

### `@PageActivationContext` — declarative context slots

For primitive context, bind a page field to a URL segment instead of hand-parsing `ctx`: the router
fills the fields (declaration order) before `onActivate` and rebuilds the URL from them on render —
no `onPassivate` needed. Coerced to the field's default type.

```ts
@PageActivationContext() id = 0;    // /view/42 → this.id === 42; passivation → /view/42
```

Keep entity fetches (`getHotel(this.id)`) in `onActivate` — the decorator binds the id, not the
object. See `writing-pages`.

## `onPassivate()` — keep the URL canonical

Returns the state that belongs in the address bar, as string segments. After render the router writes
it back with `replaceState`. Return `undefined` when there's no activation state.

```ts
override onPassivate(): readonly string[] { return [String(this.hotel!.id)]; }
```

`onActivate` reads the URL; `onPassivate` writes it — a two-way binding between page state and the
address bar.

### Multi-segment context — a required head plus optional sub-state

Context is **positional**: `onActivate(ctx)` receives the trailing segments as an array, so one route
can carry more than a single value — a required leading id plus optional **navigational sub-state**
(which tab/panel is open). Read each index; round-trip them in `onPassivate`, and **drop a trailing
segment when it equals its default** so the canonical URL stays clean (Tapestry drops trailing nulls):

```ts
// /product/radiant-tee          → ctx = ["radiant-tee"]            → Details (default) tab
// /product/radiant-tee/reviews  → ctx = ["radiant-tee", "reviews"] → Reviews tab
override async onActivate(ctx: readonly string[]): Promise<void> {
  this.tab = ctx[1] || "details";                       // optional sub-state, default "details"
  this.product = await api.getProduct({ urlKey: ctx[0] ?? "" });
}
override onPassivate(): readonly string[] {
  const seg = [this.product!.urlKey];
  if (this.tab !== "details") seg.push(this.tab);       // omit the default → clean URL
  return seg;
}
```

A link opens the tab by navigating with the segment — `Navigation.navigate("product", [urlKey,
"reviews"])` — and `/product/radiant-tee/reviews` deep-links and reloads straight to it. The tab is
now **real navigational state**, not a one-shot hand-off: no side-channel store, no "stale intent"
guard. (For a single primitive head segment, `@PageActivationContext` above is the declarative form.)

## Navigating

### `PageLink` — a real, routable link

Renders an `<a>` with a genuine href (so middle-click / open-in-new-tab / reload work), intercepting
left-click for in-memory SPA navigation:

```html
<t:pagelink page="view" context="hotel.id">Details</t:pagelink>
```

### Imperatively — `Navigation.navigate`

From an event handler, return a target (route name or page class) to navigate, or call directly:

```ts
import { Navigation } from "@qloom/core";
Navigation.navigate("book", [String(this.hotel.id)]);   // → /book/<id>
```

The context array is stringified. **An object with an `id` field contributes its `id`** — the client
analogue of Tapestry's `ValueEncoder`, so you can pass a whole entity as context:

```ts
Navigation.navigate("view", [hotel]);   // uses hotel.id → /view/42
```

## Persistent state

Plain `@Property` is in-memory and does **not** survive reload — that's fine for state you can rebuild
in `onActivate`. For state that must persist beyond the URL, use these decorators (backed by an
encrypted, in-memory-cached store; hydrate them at startup with `await SessionStore.initPersistence()`
before `Router.start()`).

### `@Persist(scope?, { key? })`

Persists **one field**, keyed by class + component id + field. Scopes:

- `'session'` (default) — survives reload, cleared on logout (`SessionStore.clearSession()`).
- `'local'` — survives across sessions (localStorage analogue).
- `'flash'` — survives exactly one activation, then discarded.

**Declare without an initializer** — an initializer would overwrite the stored value on every
construction. Values are Proxy-wrapped so nested mutations re-persist.

```ts
export class Counter extends Page {
  @Persist() visits!: number;          // survives reload
}
```

Set a stable `{ key }` if your build minifies class names (which would otherwise change the storage key).

### `@SessionState(SsoClass, { persist?, create? })`

Backs the field with a **session state object shared across pages by its class** (keyed by the class
name) — the "logged-in user" / "in-progress booking" pattern. Pass the **class** (not a factory), so
declare without an initializer:

```ts
@SessionState(UserWorkspace, { persist: false })   // in-memory only; not written to browser storage
userWorkspace!: UserWorkspace;
```

- Auto-created via `new SsoClass()` on first read (Tapestry's `create=true`).
- `persist: false` keeps it in-memory only (survives SPA navigation but never touches storage) — use for transient/sensitive graphs (an in-progress booking with card data). Otherwise it's mirrored to encrypted `sessionStorage` and survives reload.
- `create: false` reads without creating (returns `undefined` if absent) and defines a companion `<field>Exists` boolean.

### Security note

`@Persist`/`@SessionState` encryption is **at-rest obfuscation and tamper-evidence, not confidentiality
against the user** — the browser holds its own key. Never put a real secret in client state, and rely
on the **backend to authorise every mutation** independently. URL/persist state is UX convenience, not
a trust boundary.

## Logout / clearing state

`SessionStore.clearSession()` drops session-scoped state (SSOs + `@Persist('session'|'flash')`) — the
browser analogue of Tapestry's session invalidation. `@Persist('local')` is kept.

```ts
onActionFromLogout(): unknown {
  authenticator.logout();
  SessionStore.clearSession();
  return "signin";
}
```

## Checklist

1. Add each page to the router's `routes` with its compiled template; set `indexRoute`.
2. Reconstruct the page in `onActivate(ctx)` (async OK; return a route to redirect).
3. Implement `onPassivate()` for state that belongs in the URL — including optional trailing sub-state (multi-segment context), dropping a segment that equals its default.
4. Passing state page → page? Use the context (or `@Persist`/`@SessionState`) — **never a module-level store/"intent" singleton**.
5. Link with `<t:pagelink>`; navigate imperatively with `Navigation.navigate(name, context)`.
6. State that must survive reload → `@Persist`; shared cross-page objects → `@SessionState` (declare both without initializers).
7. `await SessionStore.initPersistence()` before `Router.start()`; `clearSession()` on logout.
8. Never trust client state for security — the backend authorises.
