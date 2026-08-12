# @qloom/core

The **engine spine** of Qloom. Given a compiled render program and a page/component
class, `@qloom/core` instantiates the class, drives it through Tapestry's
render-phase state machine, writes live DOM, bubbles events up the component
container tree, and re-renders Zones through a focus-preserving reconciler. It is
the runtime that stands in for the "Tapestry server" — living in the browser.

App authors rarely import this package directly; they use the decorators and base
classes in [`@qloom/runtime`](../runtime) and the components in
[`@qloom/components`](../components), which are backed by the symbols this package
reads. The compiler's *emitted* render programs call into it (`renderComponent`,
`Messages.message`), and [`@qloom/router`](../router) mounts pages through it.

## What's inside

- **`DomMarkupWriter`** — the `MarkupWriter` implementation that produces real DOM
  as the render program runs. No virtual DOM, no template interpretation at runtime.
- **`driveInstance`** — the render-phase state machine implementing Tapestry's
  return-value protocol: `false` from `afterRender` re-runs from `beginRender`
  (how `Loop` iterates), `false` from `beginRender` skips the body, `null`/void
  advances. See PLAN §7.
- **`renderComponent` / `applyInformals` / `pelRange`** — component instantiation,
  informal-parameter pass-through, and the render helpers the compiled programs call.
- **`triggerEvent`** — event bubbling **up the component container chain** (not the
  DOM), dispatching to `on<Event>From<ComponentId>` handlers / `@OnEvent`.
- **`Zones`** — Zone registration plus the **key-aware, focus-preserving
  reconciler** that patches a re-rendered subtree in place (list rows with a
  `data-key`/`id` are matched by key across re-renders; unkeyed children fall back
  to positional matching). The registry is pruned across navigations (no leak).
- **`Registry`** — the component registry (`Registry.registerComponent(...)`).
- **`Messages`** — the message catalogue (`Messages.configureMessages`,
  `Messages.message`).
- **`Navigation`** — SPA navigation (`Navigation.navigate`, `pathFor`).
- **`Assets`** — asset URL resolution.
- **`ErrorReporter`** — a pluggable telemetry sink (default `console.error`). The
  Router and Zone boundaries funnel render errors here; a page-render failure
  shows a generic error page. See the root [README](../../README.md#error-handling).
- **`mount`** — mounts a page instance into a DOM node.
- **`symbols.ts`** — the `unique symbol` keys under which per-instance / prototype
  metadata is stored (`BINDINGS`, `CONTAINER`, `COMPONENT_ID`, `CHILD_BODY`,
  `ON_EVENT`, `IMPORTS`, `VALIDATE_SPEC`, …).

## Conventions

Functions that share mutable module state are grouped into **static classes**
(`Registry`, `Messages`, `Navigation`, `Zones`, `Assets`, `ErrorReporter`) — the
public API is `Navigation.navigate(...)`, not a free function. One class per file,
filename == class name; pure types live in `types.d.ts`. See the module
architecture rules in [CLAUDE.md](../../CLAUDE.md).

Resolves to **source** (`main`/`types` → `src/index.ts`) — edits are picked up by
consumers without a build, though `tsc -b` still type-checks the graph.
