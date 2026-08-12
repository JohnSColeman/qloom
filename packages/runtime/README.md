# @qloom/runtime

The **public authoring surface** of Qloom — the `Page` and `Component` base
classes plus the decorators that stand in for Tapestry's Java annotations. This is
what an app author imports to write a page or component. Parameter bindings and
render-phase mapping are backed by the symbols the engine
([`@qloom/core`](../core)) reads.

A Qloom page/component is a plain TS class: mechanically translating a Tapestry
page from Java (same annotations, method names, structure) with its `.tml`
**unchanged** should render and behave identically (PLAN §2).

## Base classes

- **`Page`** — a routable page. Its navigational state binds to the URL via
  `onActivate`/`onPassivate` (or `@PageActivationContext`).
- **`Component`** — a reusable component.

## Decorators (Tapestry annotation stand-ins)

| Decorator | Tapestry | Purpose |
|---|---|---|
| `@Property` | `@Property` | Template-bindable instance property |
| `@Parameter` | `@Parameter` | Two-way-bound component parameter; unbound → the field initializer (or the `value` default). Honours `required`, `allowNull`, `defaultPrefix`, `value` |
| `@OnEvent` | `@OnEvent` | Event handler (alternative to `on<Event>From<Id>` naming) |
| `@InjectComponent` / `@InjectPage` | `@InjectComponent` / `@InjectPage` | Inject an embedded component / another page |
| `@PageActivationContext` | `@PageActivationContext` | Bind a field to a URL activation-context slot |
| `@SessionState` | `@SessionState` | SSO / session-scoped state |
| `@Persist` | `@Persist` | Persisted (reconstructable) state |
| `@Import` | `@Import` | Import JS/CSS assets |
| `@Validate` | `@Validate` | Attach field validation (see [`@qloom/validation`](../validation)) |

## Render-phase decorators

`@SetupRender`, `@BeginRender`, `@BeforeRenderTemplate`, `@BeforeRenderBody`,
`@AfterRenderBody`, `@AfterRenderTemplate`, `@AfterRender`, `@CleanupRender` — mark
methods that participate in Tapestry's render-phase return-value protocol, driven
by `@qloom/core`'s state machine. The `Lifecycle` interface (in `types.d.ts`)
documents the signatures.

## Also exported

- **`SessionStore`** — the static class handling SSO storage/encryption behind
  `@SessionState` / `@Persist` (`SessionStore.initPersistence()`).
- **`bindableProperties`** — introspection helper for a class's bindable props.

## Conventions

One class/decorator per file, filename == symbol name; pure types in `types.d.ts`;
`index.ts` is a barrel. Resolves to **source** (`src/index.ts`). Depends on
[`@qloom/core`](../core). See [CLAUDE.md](../../CLAUDE.md) and
[ANNOTATIONS.md](../../ANNOTATIONS.md).
