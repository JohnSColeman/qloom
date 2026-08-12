# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What Qloom is

Qloom is a **faithful, client-side port of Apache Tapestry 5's programming model** to TypeScript — not a framework "inspired by" it. Templates are Tapestry `.tml` files consumed **byte-for-byte unchanged**; pages/components are plain TS classes with decorators standing in for Tapestry annotations. There is no JSX and no server round-trip for rendering — the "Tapestry server" becomes a runtime engine living in the browser that produces live DOM.

**Read `PLAN.md` before non-trivial work** — it is the design spec and roadmap. `PARITY.md` and `COMPONENT-REFERENCE.md` track Tapestry parity and per-component coverage.

**Port from the canonical source, not from memory.** The canonical source is Apache Tapestry 5 on GitHub — [apache/tapestry-5](https://github.com/apache/tapestry-5). Component `@Parameter` signatures, render-phase semantics, and the `.tml` grammar are read from the `tapestry-core` module (`corelib/components`, `corelib/base`, `annotations`, `internal/services/TemplateParser*`).

### Two non-negotiable invariants (PLAN §2–3)

1. **Fidelity:** mechanically translating a Tapestry page/component from Java to TS (same annotations, method names, structure) with its `.tml` **unchanged** must render and behave identically. Preserve the template dialect, component names/parameters, render-phase class model, and lifecycle semantics.
2. **Reconstructability:** a page must be fully reconstructable from **(URL activation context) + (`@Persist` storage) + (backend API via the generated client)** — never from in-memory state alone. This is what keeps back-button / reload / deep-link correct. Tapestry's server-statelessness plumbing (EventLink context, `t:formdata`) is *deleted* because the instance is alive in memory; only genuine navigational state (`onActivate`/`onPassivate`) is kept and bound to the URL.

The one deliberate divergence from Tapestry: **data access**. Instead of a server DAO, Qloom generates a fully-typed client from an OpenAPI contract (see the Vite plugin below).

## Commands

Monorepo uses **pnpm workspaces** + **TypeScript project references** (`tsc -b`). Node ≥20, pnpm 9.

```sh
pnpm install
pnpm build                 # tsc -b across all packages (also `pnpm typecheck`)
pnpm clean                 # tsc -b --clean
pnpm dev                   # run examples/hello via Vite (http://localhost:5173)

pnpm test:reference-app    # build + Playwright parity gate (hotel-booking) — the main test
pnpm uat:reference-app     # build + serve the reference app for manual UAT (port 5180)
pnpm test:data             # build + Playwright gate for examples/data
pnpm test:forms            # build + Playwright gate for examples/forms

pnpm --filter @qloom/component-tests test   # component conformance suite (Playwright)
pnpm --filter @qloom/compiler test          # compiler unit suites (node --test)
```

Tests are **mostly Playwright** end-to-end gates. The exception is `@qloom/compiler`, which carries **`node --test` unit suites** (`packages/compiler/test/*.test.mjs`) covering its pure logic — the expression pipeline and the template-id / event-handler compile checks. Each `test:*` script builds first, then runs Playwright in the target package; its `webServer` boots Vite automatically (reusing a running dev server if present). There is **no root aggregate `pnpm test`** — run the gates individually.

Run a single spec / single test:

```sh
pnpm build
pnpm --filter @qloom/reference-hotel-booking exec playwright test tests/journey.spec.ts
pnpm --filter @qloom/reference-hotel-booking exec playwright test -g "logs in"
```

There is **no lint command** — `eslint-disable` comments appear in code but no ESLint config or dependency is wired up. `pnpm build` (tsc) is the correctness gate.

## Architecture

### Two-phase model (PLAN §5) — this is the whole performance story

- **Compile time** (`@qloom/compiler`, invoked by the Vite plugin): each `.tml` is parsed as XML (case-sensitive) via htmlparser2 and emitted as a **render program** — an ES module `export default function render(instance, writer, body)`. `${expr}` and bindings compile to closures over the instance; `t:` elements compile to `renderComponent(...)` calls; `<t:body/>` → `body(writer)`. No runtime template interpretation.
- **Runtime** (`@qloom/core`): the engine instantiates the class, runs its render program against a `MarkupWriter`, and wires events. Re-rendering a **Zone** re-runs one component's render through a small **focus-preserving reconciler** that patches the subtree in place — the only React-shaped thing, and it lives inside the engine, invisible to app authors. The reconciler is **key-aware**: list rows carrying a `data-key` (or `id`) are matched by key across a re-render, so an insert/remove/reorder reuses the right node (focus, listeners, uncontrolled input values follow the item); unkeyed children fall back to positional matching.

### Package roles (`packages/*`)

| Package             | Role                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
|---------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `@qloom/core`       | Engine spine: `MarkupWriter`, component registry (`Registry`), parameter `Binding`s, the **render-phase state machine** (`driveInstance`, Tapestry return-value protocol), **event bubbling up the container chain** (`triggerEvent`), Zone registration + reconciler (`Zones`), navigation (`Navigation.navigate`/`pathFor`), message catalogue (`Messages`), runtime error reporting (`ErrorReporter` — a pluggable telemetry sink, default `console.error`; the Router/Zones boundaries funnel render errors to it and a page-render failure shows a generic error page). Per-instance/prototype metadata is stored under **symbol keys** (`BINDINGS`, `CONTAINER`, `COMPONENT_ID`, `CHILD_BODY`, `ON_EVENT`, …) in `symbols.ts`. |
| `@qloom/runtime`    | The **public authoring surface**: `Page`/`Component` base classes and the decorators mirroring Tapestry annotations — `@Property`, `@Parameter`, render phases (`@SetupRender`/`@BeginRender`/`@AfterRender`/…), `@OnEvent`, `@SessionState`, `@Persist` (one file each). Backed by the symbols core reads. `SessionStore.ts` (static class) handles SSO storage/encryption; the render-phase `Lifecycle` interface lives in `types.d.ts`.                                                                                                                                                                                                                                                                                           |
| `@qloom/compiler`   | `.tml` → render-program compiler (`compileTemplate.ts`), and `generateApiClient.ts` (OpenAPI JSON → typed TS client).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `@qloom/router`     | URL ↔ page resolution and the `onActivate`/`onPassivate` two-way binding that keeps SPAs bookmarkable/reload-safe.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `@qloom/data`       | Tiny zero-dependency `fetch` runtime — `Data` (static class: `Data.configureData`, `Data.request`) + `ApiError` — that generated clients call. App code calls the generated methods, never `Data.request` directly.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `@qloom/components` | Built-in component library (`Form`, `TextField`, `Loop`, `If`, `Zone`, `EventLink`, `Grid`, `Errors`, …), installed via `registerBuiltins()`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `@qloom/validation` | Annotation-driven form validation: the `Validators` plugin registry + macro parser, `Composite` (first-failure rule set), and `ValidationMessages` (Tapestry-verbatim message catalogue). Backs `@Validate`. **Error policy: one rule for both authoring styles** — an unknown validator throws, whether the spec came from the `@Validate` annotation or `t:validate` markup. Never silently skip validation; register the name via `Validators.register(...)` (a validator) or `Validators.registerMacro(...)` (a Tapestry constraint-type macro, as the hotel-booking app does for `username`/`password`).                                                                                                                        |
| `@qloom/skills`     | Ships Qloom's **authoring skills** (the `.agents/skills/*/SKILL.md` guides) so a consuming app can install them into its own repo where its agent discovers them (harnesses don't scan `node_modules`). Provides `syncSkills()` + a `qloom-skills sync` CLI. Canonical source is repo-root `.agents/skills/`; `scripts/bundle.mjs` copies it into the package at publish (in-repo the package reads `.agents/skills/` directly). **Edit skills in `.agents/skills/`.**                                                                                                                                                                                                                                                               |
| `create-qloom`      | The **Vite plugin** (`create-qloom/vite`): `.tml` compilation, OpenAPI→client generation, message-catalogue consolidation, and the build-time event-handler check; plus the **project scaffolder** — `scaffold(dir)` / the `create-qloom` CLI (`npm create qloom <dir>`) copies `create-qloom/template/` (a Router-wired app, sample page + `.tml` + `app.properties`), pins `@qloom/*` to the installed version, and runs `installSkills()`. Published to npm as a beta; the generator + template are done.                                                                                                                                                                                                |

Library packages resolve to **source** (`main`/`types` → `src/index.ts`); only `@qloom/compiler` and `create-qloom` build to `dist`. So editing a package's `src` is picked up by consumers without a rebuild (though `tsc -b` still type-checks the graph).

### Module architecture rules (`packages/*/src`) — MUST follow

Every source file under `packages/*/src` obeys these. When adding or refactoring package code, keep to them:

1. **One class per file**, filename == class name (`AClass` lives in `AClass.ts`).
2. **Pure types → `types.d.ts`** (one per package; holds exported interfaces / type aliases). Runtime consts and `unique symbol` keys are values, not types — they go in named `.ts` files (e.g. core `symbols.ts`), never in `types.d.ts`.
3. **A `.ts` file exports at most one function**, named after the file; the private helpers it uses live in the same file. A helper shared by several functions becomes its own single-function file (e.g. `registerPhase.ts`).
4. **Functions that share mutable module state → a static class** (class name == filename), the state held in `private static` fields. Method names match the old free-function names. Grep `private static` across `packages/*/src` for the current set; today it is core `Registry` / `Messages` / `Navigation` / `Zones` / `Assets` / `Environment`; data `Data`; runtime `SessionStore`; validation `Validators` / `ValidationMessages`; components `Captcha` / `CurrentForm` / `AjaxLoopState` / `RadioGroupState` / `Field` / `Select` / `Palette` / `Tree` / `Errors`. So the public API is `Navigation.navigate(...)`, `Registry.registerComponent(...)`, `Data.request(...)`, `Messages.message(...)`, `SessionStore.initPersistence()`, etc. — **not** free functions.
5. **`index.ts` is a barrel** — only re-exports (plus a header comment). With `verbatimModuleSyntax`, split `export type { … }` from value `export { … }`.
6. **No app-specific components in `@qloom/components`.** Components belonging to an example/reference app live in that app (e.g. hotel-booking's `HotelClass` / `Workspace` / `YourBookings` are in `reference/hotel-booking/src/components` and registered in its `main.ts`).

Because rule 4 makes the framework API static-method-based, a change there ripples to **all consumers**: the compiler's *emitted* code (`Messages.message`, `Data.request`), the reference app, the examples, and `test/component-tests`. Update them together and verify with `pnpm build` + the Playwright gates. Note `pnpm build` type-checks packages only — the apps go through Vite/esbuild (no type-check) and carry a few pre-existing strict-type nits. (macOS FS is case-insensitive: `rm` the old lower-case file before writing its capitalised rename.)

### The render-phase protocol (how components control flow)

Render-phase methods (`setupRender`, `beginRender`, `afterRender`, …) return values that drive a state machine: `false` from `afterRender` **re-runs from `beginRender`** (this is how `Loop` iterates); `null`/void advances. `beginRender` returning `false` skips the body. This is Tapestry's return-value protocol, ported exactly — study `packages/components/src` (`If.ts`, `Loop.ts`, `Form.ts`, `Zone.ts` — one component per file) for the canonical patterns.

Events **bubble up the component container tree** (not the DOM). Handlers use Tapestry's `on<Event>From<ComponentId>` naming convention (or `@OnEvent`). Parameters two-way-bind to the container property; when unbound, a `@Parameter` field acts as ordinary storage so its initializer is the default.

### How an app is wired (see `reference/hotel-booking/src/main.ts`)

1. `registerBuiltins()`, then `Registry.registerComponent(name, Class, template)` for app components (template is the compiled `.tml` import).
2. `Messages.configureMessages(...)` (+ `Messages.configureLocale(locale, ...)` per locale and a `<t:localeselector/>` for runtime language switching), `Captcha.configureCaptcha(...)` / `Data.configureData(...)` as needed.
3. `new Router({ routes: [{ name, page, template }], mount, indexRoute }).start()`.

The Vite plugin (`qloomVitePlugin` in `create-qloom/src/vite-plugin.ts`) does three build-time jobs:
- Transforms `.tml` imports into render programs.
- Generates a typed client from each `dal/*.openapi.json` into a **gitignored `.qloom/dal/`** cache, exposed via the `@dal/*` import alias (mirrored in the app's `tsconfig.json` `paths`). Generated code is never committed — delete `.qloom/` and it rebuilds. Apps re-export it through a small `dal/*.ts` wrapper (e.g. `export { api as bookingApi } from "@dal/hotel-booking"`).
- Consolidates the app's `src/**/*.properties` message catalogues (Tapestry's static text, consumed byte-for-byte) into one catalogue per locale — `<name>.properties` → default locale, `<name>_<locale>.properties` → that locale — exposed via `virtual:qloom/messages`. The app registers it once: `import msgs from "virtual:qloom/messages"; Messages.registerCatalogues(msgs)`. Runtime language switching via `Messages.setLocale` (persisted to `localStorage`) + the `<t:localeselector/>` built-in.

### Workspace layout

- `packages/*` — the framework (roles above).
- `create-qloom` — the Vite plugin + the `npm create qloom` scaffolder (roles table).
- `examples/*` — focused per-feature demos, each with its own Playwright gate (`hello`, `data`, `forms`, `router`).
- `reference/hotel-booking` — the ported Tapestry reference app; its Playwright suite (`tests/*.spec.ts`) is the **live parity gate**.
