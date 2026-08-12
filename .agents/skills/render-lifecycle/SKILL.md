---
name: render-lifecycle
description: "The Qloom render cycle — render-phase order, the return-value protocol that drives loops and conditionals, how events bubble up the component container tree, and how Zone refresh works. Use when writing a component with custom render phases, understanding why If/Loop/Form behave as they do, wiring event handlers, or triggering a Zone update."
---

# The Render Lifecycle

Qloom ports Tapestry's render model exactly: components contain **no loops or conditionals over
their own body**. Instead the engine drives each instance through a fixed sequence of **render
phases**, and each phase's **return value** tells the engine what to do next. This is what makes
`Loop` iterate and `If` skip its body without either component writing a loop or an `if`.

Understanding this protocol explains why the built-ins behave as they do, and lets you write
components that participate in it.

## The render phases (exact order)

The engine (`packages/core/src/driveInstance.ts`) drives an instance through these phases:

```
setupRender → beginRender → beforeRenderTemplate → beforeRenderBody → (body) → afterRenderBody → afterRenderTemplate → afterRender → cleanupRender
```

The compiled `.tml` template renders between `beforeRenderTemplate` and `afterRenderTemplate`; any
`<t:body/>` renders between `beforeRenderBody` and `afterRenderBody`, nested *inside* the template
phases. The phases from `beginRender` through `afterRender` form a loop (see the protocol below).
`cleanupRender` is guaranteed — the engine runs it in a `finally`, so it fires even if a phase
throws (this is how `Form` reliably restores the enclosing-form context).

### How a phase method is resolved

Two ways, checked in this order:

1. **By convention** — a method whose name **is** the phase name: `setupRender`, `beginRender`, `beforeRenderBody`, `afterRenderBody`, `afterRender`, `cleanupRender`. This is what the built-ins use — plain methods, no decorator.
2. **By decorator** — put `@BeginRender` (etc.) on a differently-named method and the engine calls that method for the phase.

| Decorator | Drives phase |
|---|---|
| `@SetupRender` | `setupRender` |
| `@BeginRender` | `beginRender` |
| `@BeforeRenderTemplate` | `beforeRenderTemplate` |
| `@BeforeRenderBody` | `beforeRenderBody` |
| `@AfterRenderBody` | `afterRenderBody` |
| `@AfterRenderTemplate` | `afterRenderTemplate` |
| `@AfterRender` | `afterRender` |
| `@CleanupRender` | `cleanupRender` |

All eight Tapestry render phases are present.

So these two are equivalent:

```ts
// convention
beginRender() { this.value = this.current.value; }

// decorator (method can be named anything)
@BeginRender publishItem() { this.value = this.current.value; }
```

A component overrides **only** the phases it needs; the rest are skipped.

### `setupRender` for effects the body depends on

Because `setupRender` runs **before** `<t:body/>` — and before every template phase — it's the phase
for a side-effect the body must see already applied. `Layout` applies the page's `bodyClass` and
document title to the real `document` here: Qloom renders into `#app`, but `<body>`'s class and
`<title>` live outside it, so setting them in `setupRender` puts the class on `<body>` **before** the
page (or a width-measuring child like a gallery) paints — the timing an imperative `onActivate` setter
can't guarantee. Assets declared with `@Import` inject into `<head>` at this same phase. So: a
document/`<head>`-level effect the rendered page depends on → `setupRender` on the wrapping component,
not an ad-hoc setter. (See `writing-pages` for the page-side `t:bodyClass` parameter idiom, and
`writing-components` for `@Import`.)

## The return-value protocol

The **only** return value with meaning is a strict `=== false`. Everything else — `true`, `null`,
`undefined`, void, an object, a string — advances normally.

| Phase | Returning `false` | Returning anything else |
|---|---|---|
| `setupRender` | Abort the whole render: skip everything, run `cleanupRender`, done. (`Loop` renders nothing for an empty source this way.) | Proceed to `beginRender`. |
| `beginRender` | Skip the template + body this pass, but still run `afterRender`. (`If` skips its "then" body this way.) | Render the template + body. |
| `beforeRenderTemplate` | Suppress the template (and its body); `afterRenderTemplate` still runs. | Render the template. |
| `beforeRenderBody` | Skip the body content entirely. | Render the body. |
| `afterRenderBody` | Re-emit the body content (loops back to the body). | Exit the body loop. |
| `afterRenderTemplate` | (advances) | (advances) |
| `afterRender` | **Loop back to `beginRender`** — the core iteration mechanism. (`Loop` advances to the next item this way.) | Finish; proceed to `cleanupRender`. |
| `cleanupRender` | (ignored) | (ignored — but always runs, even on a thrown phase) |

For a lone component only `false` is special (`true` and void both advance). When **mixins** are
attached, the phase runs across all participants and the *first* to return a **boolean** (true or
false) decides the phase — so a mixin's `true` can override a host's `false`. See the `mixins`
skill.

The control flow, essentially:

```ts
if (setupRender() === false) { cleanupRender(); return; }
try {
  let again = true;
  while (again) {
    if (beginRender() !== false) {
      if (beforeRenderTemplate() !== false) renderTemplateAndBody(); // body phases nest here
      afterRenderTemplate();
    }
    again = afterRender() === false;   // false → loop back to beginRender
  }
} finally {
  cleanupRender();   // always runs, even if a phase throws
}
```

### How `Loop` iterates

```ts
setupRender()  { this.it = this.source[Symbol.iterator](); this.cur = this.it.next();
                 return !this.cur.done; }        // false when empty → render nothing
beginRender()  { this.value = this.cur.value; }  // publish current item before the body renders
afterRender()  { this.cur = this.it.next();
                 return this.cur.done ? null : false; }  // false → re-run beginRender for next item
```

Each `afterRender` returning `false` re-enters `beginRender`, republishing `value`; the template
body re-renders for the new item. Exhausted → `null` ends the loop.

### How `If` skips its body

```ts
beginRender(writer) {
  if (this.test !== this.negate) return true;         // condition met → render the body ("then")
  const elseBlock = this[BINDINGS]?.["else"]?.get?.();
  if (typeof elseBlock === "function") elseBlock(writer); // render <p:else> if present
  return false;                                        // skip the "then" body
}
```

**Takeaway for your own components:** to conditionally render your body, return `false` from
`setupRender`/`beginRender`/`beforeRenderBody`; to iterate, return `false` from `afterRender`.

## Events — bubbling up the component container tree

Qloom events climb the **component container chain** (via each component's container), **not** the
DOM tree. This is Tapestry's model.

### Handler naming

For an event named `event` triggered from a child whose `t:id` is `id`, each container is checked
for a handler in this order:

1. `on<Event>From<Id>` — event `success` from component `loginForm` → `onSuccessFromLoginForm`
2. `on<Event>` — `onSuccess`
3. A method registered with `@OnEvent({ value, component })`

Both the event name and the id are capitalised (first letter) and concatenated. **A mismatch is a
build error:** the compiler checks every `on<Event>From<Id>` method (and `@OnEvent({ component })`)
against the template's `t:id`s and fails the build with a "did you mean…" hint — so a typo or casing
slip can't silently misfire. `@OnEvent` is the explicit equivalent of the convention:

```ts
@OnEvent({ value: "selected", component: "hotel" })
pick(ctx) { /* … */ }
// same as: onSelectedFromHotel(ctx) { … }
```

### What stops bubbling, and what the return value does

- **Bubbling stops at the first container that has a matching handler.** The walk climbs the container chain until it finds one; if none exists it returns `undefined`. (Note: unlike server Tapestry, a handler returning `undefined` does **not** resume bubbling — the walk already stopped at the first *matching* handler.)
- **The handler's return value is meaningful** — it flows back to whatever triggered the event. `Form`, for example, uses the `submit` handler's return to drive **Post-Redirect-Get navigation**: a route-like string or page class → `Navigation.navigate(...)`; a message-like string → recorded as a form error. So:

```ts
async onSubmitFromLoginForm(): Promise<unknown> {
  try { await auth.login(this.username, this.password); return "index"; } // navigate to Index
  catch (e) { return e instanceof Error ? e.message : "Login failed"; }   // shown by <t:errors/>
}
```

## Zone refresh and the reconciler

A `Zone` renders a wrapper element carrying its `t:id` and registers its body. To update it,
call `Zones.refreshZone("<zoneId>")` (imported from `@qloom/core`):

```ts
import { Zones } from "@qloom/core";
// … in an event handler, after mutating state:
Zones.refreshZone("result");
```

`refreshZone` re-runs the zone body into an off-DOM scratch node, then **reconciles** the live
element's children against it, patching **in place**:

- **The reconciler is key-aware.** When any child carries a key (`data-key`, else `id`), old and new children are matched **by key** — so inserting, removing, or reordering a list row reuses the *right* DOM node (its focus, listeners, and uncommitted input follow the item, not the position). **Give list rows a `data-key`** (e.g. `<li data-key="${item.id}">`) whenever a zone re-render can reorder them. Unkeyed children fall back to **position + type** matching (correct for stable/append-only lists).
- Either way, a reused node keeps its identity, so **focus, scroll, selection, and input state survive** a refresh — the whole point over a naive innerHTML swap.
- Leaf elements with imperatively-attached listeners (`EventLink`/`PageLink`) are marked for **wholesale replacement** so their fresh listeners are used. **Forms are NOT replaced** — they reconcile in place, so a form inside a refreshed zone keeps its fields' focus and input (a reused element keeps its listeners). Input fields are likewise never replaced.

If a zone body **throws** while rendering, the reconciler leaves the live zone untouched and the error is reported via `ErrorReporter` (default `console.error`) rather than corrupting the DOM.

An Ajax `Form` with a `t:zone="result"` binding refreshes that zone automatically on a successful
submit — you don't call `refreshZone` yourself in that case (see `forms-and-validation`).

## Parameters, properties, and state (how binding works underneath)

- **`@Property`** marks a field as bindable/template-readable — plain instance storage the template may read and write.
- **`@Parameter`** on a *component* field is two-way: when the engine has installed a binding (because the parent passed the parameter), reads/writes delegate to the parent's property; when **unbound**, the field is ordinary storage, so its **initializer is the default**. (See `writing-components`.)
- **`@Persist`** and **`@SessionState`** back a field with the encrypted `SessionStore` for reconstructable state across reload/navigation. (See `routing-and-url-state`.)

## Checklist

1. To hook rendering, add a method named after the phase (or use the matching decorator).
2. Return `false` only where you mean it — `beginRender`/`beforeRenderBody` to skip the body, `afterRender` to iterate, `setupRender` to abort. Any other return advances.
3. Name event handlers `on<Event>From<Id>` (matching the child's `t:id`), or use `@OnEvent`.
4. Return a page/route from a `submit` handler to navigate (PRG); return a message string to show an error.
5. Mutate state, then `Zones.refreshZone(id)` to update a region without losing focus.
6. `Loop` shares one child instance across rows — keep per-row state on the container keyed by id, not the child (see `writing-components`).
7. A document/`<head>` effect the page depends on → apply it in `setupRender` of the wrapping component (before `<t:body/>`), not an imperative setter.
