---
name: writing-pages
description: "Writing a Qloom Page class in TypeScript — @Property state, the onActivate/onPassivate URL contract, event handlers via the on<Event>From<Component> convention, navigation, passing the page's body class and title up to the Layout, and registering the page as a route. Use when creating a new page or editing a page's class — and instead of an imperative service (BodyClass/title setter) or a global store to move page state around."
---

# Writing Pages

A **page** is a routable component — the thing a URL resolves to. It's a plain TypeScript class
extending `Page`, paired with a `.tml` template of the same name (`View.ts` ↔ `View.tml`).

```ts
import { Page, Property } from "@qloom/runtime";

export class Signin extends Page {
  @Property flashmessage = "";
  @Property username = "";
  @Property password = "";

  async onSubmitFromLoginForm(): Promise<unknown> {
    try {
      await authenticator.login(this.username, this.password);
      return "index";                       // navigate to Index (Post-Redirect-Get)
    } catch (err) {
      return err instanceof Error ? err.message : "Login failed"; // shown by <t:errors/>
    }
  }
}
```

`Page` extends `Component`, so everything in `writing-components` applies. What's *page-specific* is
the **URL contract** (`onActivate`/`onPassivate`) and being registered as a **route**.

## State: `@Property`

`@Property` marks a field as bindable and readable by the template. Plain field, plain default:

```ts
@Property hotel: Hotel | null = null;
@Property submitLabel = "Sign in";
```

The template reads these as property paths (`${submitLabel}`, `t:value="username"`). A field written
back by a two-way binding (a `TextField`'s `t:id`/`value`) must be a `@Property` (or bound `@Parameter`).

State that must survive reload or navigation goes in `@Persist` / `@SessionState` instead — see
`routing-and-url-state`. **Never rely on in-memory `@Property` state to survive a reload** — that
breaks reconstructability.

## The URL contract: `onActivate` / `onPassivate`

```ts
onActivate?(context: readonly string[]): unknown | Promise<unknown>;
onPassivate?(): readonly unknown[] | undefined;   // objects with an id are encoded by their id
```

**`onActivate(context)`** — called when the router resolves the route. `context` is the trailing
path segments (`/view/42` → `["42"]`). It **may be async** (await your data client here), and it may
**return a redirect target** (a page class or route name) to send the user elsewhere. A redirect
uses `replaceState`, so the redirecting URL never traps the back button:

```ts
export class View extends Page {
  @Property hotel: Hotel | null = null;

  override async onActivate(context: readonly string[]): Promise<void> {
    this.hotel = await bookingApi.getHotel({ id: Number(context[0]) });
  }
}
```

```ts
export class Index extends Page {
  override onActivate(): unknown {
    return authenticator.isLoggedIn() ? "search" : "signin";   // redirect
  }
}
```

**`onPassivate()`** — returns the canonical state that belongs in the URL, as string segments. After
render the router writes it back with `replaceState`, keeping the address bar honest. Return
`undefined` for pages with no activation state.

```ts
override onPassivate(): readonly string[] { return [String(this.hotel.id)]; }
```

The rule: a page must be reconstructable from `onActivate(context)` + persistent storage + the API.
If it is, back/forward/reload/deep-link all work for free.

> **Never ferry state between pages through a module-level store or an "intent" singleton** — that's
> in-memory state with no page boundary, so it can't survive a reload and breaks reconstructability.
> Hand-offs go through the activation context (multi-segment if you need sub-state like an open tab)
> or `@Persist`. See `routing-and-url-state`.

### `@PageActivationContext` — declarative context slots

For **primitive** context, bind a field to a URL segment instead of parsing `context` by hand.
Fields are filled from the URL (in declaration order) before `onActivate`, and the router
re-synthesises the URL from them on render (no `onPassivate` needed). The value is coerced to the
field's default type (string/number/boolean):

```ts
export class View extends Page {
  @PageActivationContext() id = 0;         // /view/42 → this.id === 42
  @Property hotel: Hotel | null = null;
  override async onActivate(): Promise<void> {
    this.hotel = await bookingApi.getHotel({ id: this.id });   // entity fetch stays in onActivate
  }
}
```

Use `onActivate(context)` directly when the segment maps to a fetched entity (Qloom has no
Tapestry ValueEncoder to turn an id into an object).

## Page-type presentation → a Layout parameter, not an imperative service

A page often sets something that lives **outside its own markup** — the `<body>` class a themed
stylesheet keys off (`catalog-category-view page-layout-2columns-left`), the document title. Qloom
renders into `#app`, not `document`, and there's no lifecycle hook for "run this imperative setter on
activate". The idiom (Tapestry's `pageClass`/`title`) is to **pass the value up to the shell as a
declarative `@Parameter`** and let the `Layout` apply it:

```html
<!-- Category.tml — the page declares its class + title; the shell owns <body> -->
<html t:type="layout" t:pageTitle="literal:Jackets"
      t:bodyClass="literal:catalog-category-view page-layout-2columns-left">
  … page body …
</html>
```

```ts
// Layout applies both to the real document in setupRender — which runs BEFORE <t:body/> renders the
// page, so the class is on <body> before the page (or a width-measuring child) paints. See render-lifecycle.
export class Layout extends Component {
  @Parameter({ required: true }) pageTitle!: string;
  @Parameter() bodyClass?: string;
  setupRender(): void {
    document.body.className = this.bodyClass ?? "";
    document.title = this.pageTitle;
  }
}
```

> **Anti-pattern — the imperative setter service.** A `BodyClass.set(cls)` / `TitleService` the page
> pokes from `onActivate`. It has no Tapestry analogue, scatters DOM mutation across pages, and isn't
> declarative — the template no longer tells you the page's body class, and the timing (before the
> body paints) is no longer guaranteed by the framework. Pass a parameter up instead. For assets a
> component needs (stylesheets/libraries), see `@Import` in `writing-components` — not a `<head>` edit.

## Event handlers

Handlers follow the `on<Event>From<ComponentId>` convention — the component id is its `t:id` in the
template. A `Form` with `t:id="loginForm"` firing `submit` → `onSubmitFromLoginForm`. A less specific
`on<Event>` (any component) also works, as does the explicit `@OnEvent` decorator.

**The `From<Id>` is checked at build time:** the compiler matches every `on<Event>From<Id>` method
against this page's template `t:id`s and **fails the build** on a mismatch (with a "did you mean…"
hint) — so a typo or casing slip can't silently never-fire. Keep the casing exact
(`t:id="loginForm"` → `onSubmitFromLoginForm`).

```ts
onSubmitFromLoginForm() { … }     // "submit" from t:id="loginForm"
onActionFromDelete(id) { … }      // "action" from t:id="delete", context passed as arg
```

A handler's **return value drives navigation** (Post-Redirect-Get): return a page class or route
name to navigate; return a message string from a form submit to show a validation error via
`<t:errors/>`. Handlers may be async. See `render-lifecycle` for the full bubbling/return rules.

### Navigating imperatively

Return a target from a handler, or call `Navigation.navigate` directly:

```ts
import { Navigation } from "@qloom/core";
Navigation.navigate("book", [String(this.hotel.id)]);   // → /book/<id>
```

The context array is stringified; an object with an `id` field uses its `id` (the ValueEncoder
analogue). See `routing-and-url-state`.

To navigate to another page as a typed target, inject it with `@InjectPage(PageClass)` and return it
(or pass it to `Navigation.navigate`) from a handler:

```ts
@InjectPage(Signin) signin!: Signin;
onCancel(): unknown { return this.signin; }   // → navigates to Signin
```

## Registering the page as a route

Pages are **not** registered with `Registry.registerComponent`. They go in the router's `routes`
(in `main.ts`), each with a name, the class, and the compiled template:

```ts
import { Signin } from "./pages/Signin";
import signinTemplate from "./pages/Signin.tml";

new Router({
  routes: [
    { name: "index",  page: Index,  template: indexTemplate },
    { name: "signin", page: Signin, template: signinTemplate },
    { name: "view",   page: View,   template: viewTemplate },
  ],
  mount: document.querySelector("#app")!,
  indexRoute: "index",
}).start();
```

The route `name` is the first URL segment (`/signin`, `/view/42`); the `indexRoute` maps to `/`.
Route matching is case-insensitive. See `routing-and-url-state` for how paths resolve.

## Common shape of a page

```ts
import { Page, Property, SessionState } from "@qloom/runtime";
import { bookingApi, type Hotel } from "../../dal/BookingApi";
import { UserWorkspace } from "../data/UserWorkspace";

export class Book extends Page {
  @Property booking: Booking | null = null;
  @SessionState(UserWorkspace, { persist: false }) userWorkspace!: UserWorkspace;

  // Blocks declared in the .tml are hoisted onto the instance by the compiler:
  declare bookBlock: (writer: unknown) => void;
  declare confirmBlock: (writer: unknown) => void;
  get step() { return this.booking?.status ? this.confirmBlock : this.bookBlock; }

  override onActivate(ctx: readonly string[]): unknown {
    this.booking = this.userWorkspace.restoreBooking(Number(ctx[0]));
    return this.booking ? null : "search";     // nothing in progress → redirect
  }

  onSubmitFromBookingForm(): unknown {
    if (this.booking!.checkinDate >= this.booking!.checkoutDate)
      return "Check-out date must be after check-in";   // error via <t:errors/>
    // … advance step, re-navigate …
    return null;
  }
}
```

## Checklist

1. `class X extends Page`, paired with `X.tml`. Fields the template reads/writes are `@Property`.
2. Fetch data in `onActivate` (may be `async`); return a route/page to redirect.
3. Implement `onPassivate()` for any state that belongs in the URL — keep the page reconstructable.
4. Event handlers: `on<Event>From<Id>`; return a route/page to navigate, a message string to error.
5. State that must survive reload/nav → `@Persist`/`@SessionState`, not plain `@Property`; state handed to another page → the activation context, not a global/"intent" store.
6. Body class / document title → pass up to `Layout` as `t:bodyClass`/`t:pageTitle`, not an imperative setter service.
7. Register the page in the router's `routes` with its compiled `.tml`, not in `Registry`.
