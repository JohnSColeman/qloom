---
name: writing-components
description: "Writing a reusable Qloom Component class in TypeScript — @Parameter inputs and two-way binding, required/default values, the component body via <t:body/>, block parameters, computed getters, holding per-row state for a component inside a Loop on the container, declaring stylesheets/libraries with @Import, and registering the component with Registry.registerComponent. Use when creating a new app component (not a page) or editing one — and instead of a static/module-level store for a looped component's state or a manual index.html <head> edit for its assets."
---

# Writing Components

A **component** is a reusable piece of UI: a class extending `Component`, usually paired with its
own `.tml` template. Pages *are* components (a `Page` is a routable `Component`), so this skill's
rules apply to pages too — pages just add the URL contract (`writing-pages`).

```ts
import { Component, Parameter } from "@qloom/runtime";

export class Panel extends Component {
  @Parameter({ required: true }) heading!: string;
}
```

```html
<!-- Panel.tml -->
<section class="panel">
  <h2>${heading}</h2>
  <div class="panel-body"><t:body/></div>
</section>
```

Used as:

```html
<t:panel heading="Welcome">…this content renders where <t:body/> is…</t:panel>
```

## `@Parameter` — inputs from the container

A `@Parameter` field is an input passed by the enclosing template. Binding is **two-way**: when the
container binds the parameter, reading the field reads the container's property and **writing it
writes back** to the container. When the parameter is **not** bound, the field is ordinary storage —
so its **initializer is the default**.

```ts
export class HotelClass extends Component {
  @Parameter({ required: true }) stars = 0;   // required; initializer is the fallback default
  get hotelClass() { return `/static/${this.stars}-star.gif`; }
}
```

- `@Parameter({ required: true })` — the container must bind it. **Enforced:** an unbound required parameter throws at render (`qloom: required parameter "x" of <comp> is not bound`), naming the component + parameter — no more silent `undefined`. Declare with `!` (`heading!: string`) since there's no meaningful default.
- `@Parameter()` optional — give it a default via the field initializer (`negate = false`).
- **Two-way**: a field component's `value` parameter writes user input back to the container's property. This is how `TextField t:value="username"` fills `this.username` on the page (see `forms-and-validation`).
- `@Parameter({ allowNull: false })` — a *bound* parameter that resolves to `null`/`undefined` throws on read (fail-loud), naming the component + parameter. Default is null-tolerant; an unbound field is unaffected.
- `@Parameter({ defaultPrefix: "literal" })` — a *bare* template value for this parameter is the raw string, not a property expression (`mode="cancel"` → `"cancel"`, not `this.cancel`). Default is `"prop"`. An explicit `literal:`/`prop:`/`message:` prefix in the template always wins.
- `@Parameter({ value: "message:my.key" })` — a default *binding expression* used when the parameter is unbound and has no field initializer: `literal:` / `message:` (catalogue lookup) / `prop:a.b` (a dotted path on the container). Prefer a plain field initializer for constant defaults; reach for `value` when the default must be a live expression.
- Still unimplemented (rarely needed): `cache`, `principal`, `autoconnect`, `name` — `principal`/`cache` are largely N/A to Qloom's lazy-binding model.

## `@InjectComponent` — a typed handle to an embedded child

To call methods on a child component declared in your template, inject it by `t:id` (defaults to the
field name). Available once the child has rendered — i.e. inside event handlers, as in Tapestry:

```ts
@InjectComponent() loginForm!: Form;   // resolves the child with t:id="loginForm"
```

`@InjectPage(SomePage)` is the page equivalent (a navigation handle) — see `writing-pages`.

Contrast with `@Property`: `@Property` is *your own* bindable state; `@Parameter` is state **owned by
the container** that you read/write through a binding. Use `@Property` for internal state a component
manages itself, `@Parameter` for inputs.

## Per-item state for a component inside a `Loop` — hold it on the container

`Loop` renders **one shared instance** of a child across every iteration — it republishes `value` and
re-renders the *same* instance (see `render-lifecycle`). So a child rendered in a loop **cannot keep
per-row state in its own `@Property`**: inside a click handler `this.<field>` (and `this.<theItem>`)
is whatever the **last** rendered row left there, not the clicked row's.

Put that state on the **container** — the page, or a base component that owns the loop — keyed by item
id, and make the child **presentational**: state in via `@Parameter`, intent out via an event whose
**context carries the item (or its id)**, so the handler routes by context, never `this`:

```ts
export abstract class ProductGrid extends Component {
  @Parameter({ required: true }) products!: Product[];
  private selections = new Map<number, Options>();      // per-item state, keyed by id — lives HERE

  get rows() {                                          // decorate each item with its own slice
    return this.products.map(p => ({ product: p, selected: this.selections.get(p.id) ?? {} }));
  }
  onSwatch(ctx: string): void {                         // bubbles up from a card; ctx carries the id
    const [id, code, val] = ctx.split(":");
    const key = Number(id);
    this.selections.set(key, { ...(this.selections.get(key) ?? {}), [code]: val });
    Zones.refreshZone("gridZone");                      // re-render every card from the updated rows
  }
}
```

```html
<div t:type="zone" t:id="gridZone">
  <t:loop source="rows" value="row">
    <t:productcard product="row.product" selected="row.selected"/>   <!-- params in; events out -->
  </t:loop>
</div>
```

The container is a **single stable instance**: its fields survive a `Zone` refresh (the same instance
tree re-renders) and are **reborn on navigation** — the same page-scoped, reconstructable lifecycle as
any `@Property`. This is the same shape the PDP uses for its own `@Property selectedOptions`.

> **Anti-pattern — the process-global store.** A module-level `Map`/singleton (`CardSwatchStore`,
> `CardTocartState`) to dodge the shared-instance hazard. It's "in-memory state with no page
> boundary": it **leaks across navigations** and breaks reconstructability. The container instance is
> the correct home — it already gives you the page boundary for free. **If you reach for a `static`/
> module-level store to hold a component's state, stop** — hoist the state to the container.

## The body: `<t:body/>`

Put `<t:body/>` in your template where the caller's content should render. The engine passes the
child body through; your component decides *whether* and *where* to render it. Omit `<t:body/>` and
the caller's content is discarded (the `DiscardBody` behaviour, for free).

## Block parameters (`<p:...>`)

To accept named chunks of markup (not just one body), declare a parameter and let the caller fill it
with a `<p:name>` block. `Layout` does this for its sidebar:

```ts
export class Layout extends Component {
  @Parameter({ required: true }) pageTitle!: string;
  @Parameter() sidebar?: unknown;   // a Block (render function) filled by <p:sidebar>
}
```

```html
<!-- caller -->
<html t:type="layout" t:pageTitle="Members login">
  … main body …
  <p:sidebar><p>Welcome to the app…</p></p:sidebar>
</html>
```

In your template, render the block via `<t:delegate to="sidebar"/>`. See `authoring-templates` for
blocks and `Delegate`.

## Computed values: getters

Templates run the full property-expression language, so a method call like `${hotelClass()}` works —
but exposing computed values as a **getter** (read as a property path) is the idiomatic Tapestry
style and keeps templates declarative:

```ts
export class HotelClass extends Component {
  @Parameter({ required: true }) stars = 0;
  get hotelClass() { return `/static/${this.stars}-star.gif`; }  // template: ${hotelClass}
}
```

## Custom render behaviour and events

Most components are just data + template. When you need to control the render (skip the body,
iterate, run setup) or handle events, add render-phase methods and event handlers — see
`render-lifecycle`. Event handlers on a component follow the same `on<Event>From<Id>` convention and
bubble up from children.

```ts
export class Layout extends Component {
  onActionFromLogout(): unknown {         // "action" from a child t:id="logout"
    authenticator.logout();
    SessionStore.clearSession();
    return "signin";                      // navigate
  }
}
```

## Templates: what a component template can be

- A single root element (`<section>…</section>`), or
- `<t:container>…</t:container>` when you don't want a wrapper element of your own (renders children only):

```html
<t:container xmlns:t="https://tapestry.apache.org/schema/tapestry_5_4.xsd">
  <dd class="stars"><img src="${hotelClass}" alt="${stars} Stars"/></dd>
</t:container>
```

A component **without** a template (pure logic, e.g. a security gate) is registered with no template
argument and renders via its render phases / nothing.

## Declaring assets a component needs: `@Import`

A component (or page) that only works with a particular **stylesheet or JS library** should declare
it with the `@Import` **class decorator** (Tapestry's `@Import`, ported). The engine injects each
asset into `<head>` **once, deduped**, at the component's `setupRender` timing — so the asset ships
with the component that needs it instead of being hand-added to `index.html`'s global `<head>`:

```ts
import { Component, Import } from "@qloom/runtime";

@Import({
  stylesheet: ["context:/static/gallery.css"],   // injected into <head>, once, deduped
  library: ["context:/static/fotorama.js"],
})
export class ProductGallery extends Component { /* … */ }
```

- `stylesheet` / `library` are arrays of `context:`-prefixed asset paths; both accumulate across
  multiple `@Import`s on the class. (`module`/`esModule`/`stack` are reserved and currently ignored.)
- **Scope-locality is the point:** a component-scoped stylesheet belongs on its owning component, not
  in `index.html`. Keep only truly global, first-paint CSS (the base theme) and order-sensitive JS in
  `index.html` — `@Import` injects **async/unordered**, so anything a component's first paint depends
  on (FOUC risk) may still need to be global. Weigh that per asset.

> **Anti-pattern — the manual `<head>` edit.** Dropping every component's `<link rel="stylesheet">`
> into `index.html`. It couples an asset to the shell instead of the component that needs it, and it
> loads even on pages that never use the component. Declare it with `@Import` on the owner.

## Registering the component

Register app components in `main.ts` **before** the router starts. The registration name is what the
template uses as `t:type` (matched case-insensitively):

```ts
import { Registry } from "@qloom/core";
import { registerBuiltins } from "@qloom/components";
import { Panel } from "./Panel";
import panelTemplate from "./Panel.tml";

registerBuiltins();                                        // built-ins first
Registry.registerComponent("panel", Panel, panelTemplate); // <t:panel …>
Registry.registerComponent("security.authenticated", Authenticated); // no template (logic only)
```

- The name may contain dots (`security.authenticated` → `<t:security.authenticated>`).
- Keep app-specific components **in the app**, not in `@qloom/components` (that package is the shared built-in library only).

## Checklist

1. `class X extends Component`; pair with `X.tml` unless it's pure logic.
2. Inputs from the caller → `@Parameter` (`{ required: true }` + `!`, or a default initializer). Internal state → `@Property`.
3. Put `<t:body/>` where caller content should render; use `@Parameter` + `<p:name>` + `<t:delegate>` for named blocks.
4. Expose computed values as getters — templates read property paths only.
5. Per-row state for a component inside a `Loop` lives on the **container** keyed by id (child is presentational: params in, events out) — never a `static`/module-level store.
6. A component-scoped stylesheet/library → `@Import` on the owning class, not a manual `index.html` `<head>` edit.
7. Register with `Registry.registerComponent("name", Class, template)` in `main.ts`, before `Router.start()`.
8. For render control or events, see `render-lifecycle`.
