---
name: mixins
description: "Mixins in Qloom — attaching behaviour to a host component with t:mixins and class-level @Mixin, the before/after interleaving model (@MixinAfter), and the injection annotations a mixin uses to reach its context (@InjectContainer, @BindParameter, @Environmental). Covers writing a mixin, the built-in mixin catalogue (Confirm, DiscardBody, RenderDisabled, EchoValue, ZoneRefresh, TriggerFragment, Autocomplete), ordering/duplicate rules, and the render-timing and teardown gotchas. Use when attaching or authoring a mixin, or adding cross-cutting behaviour to a field/link/zone."
---

# Mixins

A **mixin** is a class that attaches behaviour to a *host* component without replacing it. Qloom
ports Tapestry's mixin model exactly: the mixin's render-phase methods **interleave** with the
host's, it **shares the host's parameter bindings**, and it can reach the host, a host parameter,
or an ambient service through injection annotations. Mixins are how you add cross-cutting
behaviour — a confirm dialog on a link, type-ahead on a field, an auto-refresh on a zone — to an
*unchanged* host.

**Mixin vs component:** write a **component** when you're rendering something (it owns markup and a
template). Write a **mixin** when you're *augmenting* an existing component's element or lifecycle
(it has no template; it writes onto the host's element or wires client behaviour). If you'd have to
copy the host just to add one attribute or one listener, you want a mixin.

## Attaching a mixin

Two ways, and they combine:

```html
<!-- per-usage: t:mixins on the host component, comma-separated -->
<a t:type="actionlink" t:id="del" t:mixins="confirm" t:message="literal:Delete this?">Delete</a>
<input t:type="textfield" t:id="city" t:value="city" t:mixins="autocomplete" t:minChars="2"/>
```

```ts
// class-level: the component ALWAYS carries the mixin, no t:mixins needed
@Mixin("renderdisabled")
export abstract class Field extends Component { /* ... */ }
```

- `t:mixins="a, b"` attaches registry mixins to **this usage** of the host.
- `@Mixin("name", { order })` (a class decorator) makes **every instance** of the class carry the
  mixin — Tapestry's *implementation mixin*. Collected up the prototype chain, so a base class's
  mixins flow to subclasses (this is how every `Field` gets `renderdisabled`).
- The two lists are **merged**. Attaching the **same** mixin twice (via `@Mixin` and `t:mixins`, or
  twice in either) is a **fail-loud error** — don't add `t:mixins="renderdisabled"` to a field; the
  base already carries it.

Mixin names are registry ids, registered exactly like components:
`Registry.registerComponent("confirm", Confirm)` (built-ins are registered by `registerBuiltins()`).

## How a mixin interleaves with the host

Each render phase runs **before-mixins → host → after-mixins**. A mixin is a "before" mixin by
default; mark it `@MixinAfter` to make it an "after" mixin.

- **Before phases** (`setupRender`, `beginRender`, `beforeRenderBody`, `beforeRenderTemplate`):
  order is `[before-mixins, host, after-mixins]`.
- **After phases** (`afterRenderBody`, `afterRenderTemplate`, `afterRender`, `cleanupRender`):
  the order **reverses** to `[after-mixins, host, before-mixins]` — so a "before" mixin's
  `afterRender` runs *after* the host closes its element (its trailing markup lands as a following
  sibling, not nested inside).

**Return-value protocol (all participants).** The **first** participant in that order to return a
**boolean** aborts the rest, and that boolean is the phase result; a `void`/`null` return continues
to the next; if none returns a boolean the result is `true`. So a mixin fully participates — not
just via `false`:

- `DiscardBody`'s `beforeRenderBody → false` drops the host's body.
- a "before" mixin returning `true` from `beforeRenderBody` **overrides** a host that returns
  `false`, forcing the body to render (it aborts before the host's method runs).
- a mixin returning `false` from `afterRender` drives the host's render **loop**, exactly as `Loop`
  does with its own `afterRender`.

`false` from `beginRender` skips the body; `false` from `setupRender` skips to `cleanupRender`.

## What a mixin can reach (injection annotations)

A mixin **shares the host's bindings**, so its own `@Parameter()` fields read the host's bound
attributes by name:

```ts
@MixinAfter
export class Confirm extends Component {
  @Parameter() message = "Are you sure?"; // reads t:message on the host
}
```

Beyond its own parameters, a mixin reaches outward with three annotations:

| Annotation | Reaches | Example |
|---|---|---|
| `@InjectContainer` | the **host** component instance | `RenderDisabled` reads `host.disabled` |
| `@BindParameter(...names)` | a **host parameter**, two-way | `EchoValue` reads/writes the field's `value` |
| `@Environmental(token)` | an **ambient value** an ancestor pushed | reach a `Form`/service with no reference to it |

`@Environmental` is the mixin-critical one: a mixin has no template and no children, so it can't
prop-drill — an ambient service published by some ancestor (via `Environment.push(token, value)`)
is often the *only* way to reach it. See the `render-lifecycle` skill for the `Environment` stack.

## Writing a mixin

A mixin is a `Component` subclass with **no template**, registered by name. It writes onto the
host's element or wires client behaviour in a render phase.

```ts
import { Component, MixinAfter, InjectContainer } from "@qloom/runtime";
import type { MarkupWriter } from "@qloom/core";

@MixinAfter
export class RenderDisabled extends Component {
  @InjectContainer private host: any;
  beginRender(writer: MarkupWriter): void {
    if (this.host?.disabled) writer.attribute("disabled", "disabled");
  }
}
```

Then `Registry.registerComponent("renderdisabled", RenderDisabled)`.

### Timing: getting the host's element

To write attributes onto (or capture) the host's open element, you need the mixin to run while that
element is open — so use **`@MixinAfter`**:

- **`beginRender` + `writer.attribute(...)`** — works when the host's `beginRender` does **not**
  return `false`. The host has opened its element; the after-mixin adds to it. (`Confirm`,
  `RenderDisabled`.)
- **`afterRender` + `writer.currentElement()`** — use when the host's `beginRender` returns `false`
  (e.g. `Checkbox`, which has no body): that short-circuits after-mixins *in `beginRender`*, but in
  the reversed after-phase an `@MixinAfter` mixin's `afterRender` runs **before** the host closes its
  element, so `writer.currentElement()` is still the host's element. (`TriggerFragment`,
  `Autocomplete`.)

### Resources must self-clean

A mixin that attaches a timer, listener, or popup **must tear it down** when the host goes away
(navigation, an enclosing `If` turning off) — there is no `cleanupRender` hook fired on unmount.
Two proven patterns:

- **Capture the host element and self-clear** when it disconnects: `if (!el.isConnected) { clearInterval(t); return; }` (`ZoneRefresh` — it also captures the exact node via `Zones.zoneElement(id)` so a later page reusing the id gets its own timer).
- **Insert extra DOM as a sibling of the host element**, not on `document.body`, so it detaches with
  the host automatically (`Autocomplete`'s dropdown). Listeners on the host element are GC'd with it.

### Ordering

Give constraints on `@Mixin` (and resolve against other attached mixin names):

```ts
@Mixin("marktwo", { order: ["before:markone"] })
@Mixin("markone")
export class Thing extends Component { /* ... */ }
```

`before:<name>` / `after:<name>` / `before:*` / `after:*`. A cycle is a fail-loud error. Ordering
sets the sequence **within** the before- and after-groups (the `@MixinAfter` split still decides
which group).

## Built-in mixin catalogue

| Mixin | Attach to | What it does |
|---|---|---|
| `confirm` | a link/submit | Gates the action behind `window.confirm`; `t:message`, `t:title`. |
| `discardbody` | any component | Drops the host's body (`beforeRenderBody → false`). |
| `renderdisabled` | a field | Renders `disabled` when the field's `disabled` is set. **Auto-applied to every `Field`** — never attach it by hand. |
| `zonerefresh` | a `Zone` | Timer re-renders the zone; fires a `refresh` event first so the page updates state. `t:period` (seconds). Self-tears-down. |
| `triggerfragment` | a checkbox/radio | Toggles a `FormFragment`'s visibility; `t:fragment="literal:<id>"`, `t:invert`. Hiding drops its fields from submit. |
| `autocomplete` | a text field | Type-ahead: fires `provideCompletions`, the page's `onProvideCompletionsFrom<Id>(input)` returns matches (sync or a `Promise`); dropdown + keyboard/mouse select. `t:minChars`/`t:maxSuggestions`/`t:debounce`. |
| `echovalue` | a field | Test/demo mixin for `@BindParameter` (reads/writes the host `value`). |

## Gotchas

- **`literal:` for id-style params.** A bare `t:fragment="shipping"` is a **property expression**
  (`page.shipping`) and resolves to `undefined`. For a literal string (a component-id reference, a
  message), write `t:fragment="literal:shipping"`. Numeric literals (`t:period="5"`) are fine bare.
- **Don't double-attach.** `renderdisabled` is on every field already; adding `t:mixins="renderdisabled"` throws a duplicate-mixin error. Same for anything you've put on the class via `@Mixin`.
- **`FormFragment` and other addressable hosts render their `t:id`** as an `id` — a mixin can find the target with `document.getElementById(fragmentId)`.
- **Serverless adaptations.** Tapestry mixins that used `JavaScriptSupport` / event links / `@HeartbeatDeferred` are ported to run natively client-side; there is no server round-trip. Model the data source as a **local event** the page answers (as `Autocomplete` does), not a fetch the mixin performs.

## Checklist

- [ ] Is this augmenting an existing component? → mixin. Rendering something new? → component.
- [ ] Registered the mixin by name (`Registry.registerComponent`), or is it a built-in?
- [ ] Writing onto the host element? → `@MixinAfter`; `beginRender` unless the host returns `false` from it (then `afterRender` + `writer.currentElement()`).
- [ ] Reaching outward? → `@InjectContainer` (host) / `@BindParameter` (host param) / `@Environmental` (ancestor service).
- [ ] Attached a timer/listener/popup? → it self-clears when the host element detaches.
- [ ] id-style params written as `literal:`; not double-attaching a class `@Mixin`.
