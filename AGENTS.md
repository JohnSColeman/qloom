# Building Apps with Qloom

This guide is for **authoring Qloom applications** — writing pages, components, and templates.
For the framework's own internals and contribution rules, see `CLAUDE.md` and `PLAN.md`.

## What Qloom is

Qloom is a **faithful, client-side port of Apache Tapestry 5's programming model** to TypeScript.
You build a UI from exactly two kinds of artefact:

1. **A TypeScript class** — a `Page` or a `Component`, a plain class with decorators that stand in for Tapestry's annotations (`@Property`, `@Parameter`, `@OnEvent`, render-phase decorators, …).
2. **A template** — a Tapestry `.tml` file: HTML with `t:`-namespaced elements/attributes and `${...}` expansions, woven into that class.

There is **no JSX** and **no server round-trip for rendering**. The engine runs in the browser,
instantiates your class, executes the compiled template, and produces live DOM. Re-rendering a
region (a `Zone`) patches the DOM in place, preserving focus and input state.

A Qloom app is a browser-only SPA. Business logic and persistence live behind a **real API**,
reached through a typed client generated from an OpenAPI contract (the `data-access` skill). Qloom
renders; it does not own your database.

### The mental model comes from Tapestry

If you know Tapestry 5, you already know Qloom: same `.tml` dialect, same component names and
parameters, same render-phase lifecycle, same event conventions, same `onActivate`/`onPassivate`
URL discipline. Where you need reference material on a component or template feature, consult, in
priority order:

1. **Qloom's actual behaviour** — the examples (`examples/*`) and reference app (`reference/hotel-booking`) show the real, working dialect. When in doubt, grep these for a working usage.
2. **Qloom's source** (`packages/*/src`) — where Qloom diverges from Tapestry, the code wins.
3. **Tapestry's docs** — <https://tapestry.apache.org/documentation.html> and the [Component Reference](https://tapestry.apache.org/component-reference.html) — accurate for behaviour, but superseded by (1)/(2) wherever Qloom diverges (some Tapestry features are unimplemented or degraded — the skills flag these).

### Two things Qloom guarantees you (and asks of you)

1. **Fidelity to Tapestry.** A page/component mechanically translated from Tapestry Java to TS, with its `.tml` **unchanged**, renders and behaves identically. If a template won't render, that's a framework bug — don't hand-edit the `.tml` to work around it.
2. **Reconstructability.** A page must be fully reconstructable from **(URL activation context) + (`@Persist`/`@SessionState` storage) + (backend API)** — never from in-memory state alone. Honour this and back-button / reload / deep-link Just Work. Cheat and you've rebuilt a fragile SPA. (See `routing-and-url-state`.)

## Skills

Load the skill that matches your task. The first four are the core authoring model; the rest are
focused guides that build on them.

| Skill | When to Use |
|-------|-------------|
| `writing-pages` | Writing a `Page` class — `@Property` state, `onActivate`/`onPassivate`, event handlers (`on<Event>From<Component>`), navigation, and registering the page with the `Router`. |
| `writing-components` | Writing a reusable `Component` class — `@Parameter` inputs and two-way binding, informal parameters, the component body and `<t:block>`/`<p:…>` blocks, and registering it via `Registry.registerComponent`. |
| `authoring-templates` | Writing `.tml` — the `t:` namespace, `${...}` expansions, binding prefixes, `t:type`/`t:id`, `<t:body>`, `<t:container>`, `<t:block>`, `<t:delegate>`, `<p:…>` parameter blocks, informal parameters. **Includes the exact list of what Qloom's compiler supports vs. what throws or is silently degraded.** |
| `render-lifecycle` | The render cycle — the render-phase order, the return-value protocol that drives loops and conditionals, how events bubble up the component container tree, and how `Zone` refresh works. Read this to understand *why* components behave as they do. |
| `using-components` | Reference for the built-in component library — parameters, events, and `.tml` usage for each implemented component (Form, TextField, Select, Loop, If, Zone, EventLink, PageLink, Grid, BeanDisplay, DateField, …). |
| `forms-and-validation` | Building forms — `Form`, the field components, two-way binding, validators, `Errors`, and the submit → validate → Post-Redirect-Get flow. |
| `routing-and-url-state` | Routing and URL state — the `Router`, `onActivate`/`onPassivate` URL binding, `@Persist`, `@SessionState`, `PageLink`, and the reconstructability invariant. |
| `data-access` | Fetching data — the `dal/` OpenAPI convention, the generated typed client, `configureData`, and calling operations from `onActivate` and event handlers. |

## Building and running

Node ≥ 20, pnpm 9. The monorepo uses pnpm workspaces + TypeScript project references.

```sh
pnpm install
pnpm build        # tsc -b across all packages — the type-correctness gate
pnpm dev          # run examples/hello via Vite (http://localhost:5173)
```

`pnpm build` type-checks the **framework packages**; the apps (`examples/*`, `reference/*`) go
through Vite/esbuild with no type-check, so **run the app or its Playwright gate** to catch
app-level errors. There is no lint step.

To run a reference app for manual inspection:

```sh
pnpm uat:reference-app       # build + serve hotel-booking at http://localhost:5180
```

## Testing your work

Tests are **Playwright** end-to-end gates (no unit-test runner). Each `test:*` script builds first,
then runs Playwright, booting Vite automatically.

| Command | What it exercises |
|---|---|
| `pnpm test:reference-app` | The hotel-booking parity gate — the fullest example of a real Qloom app. |
| `pnpm test:forms` | `examples/forms`: two-way binding, validation, Errors, PRG, wizard. |
| `pnpm test:data` | `examples/data`: Grid, BeanDisplay, the generated data client. |
| `pnpm --filter @qloom/component-tests test` | Per-component conformance suite. |

Run a single spec or test:

```sh
pnpm build
pnpm --filter @qloom/reference-hotel-booking exec playwright test tests/journey.spec.ts
pnpm --filter @qloom/reference-hotel-booking exec playwright test -g "logs in"
```

## How an app is wired

Every Qloom app has a `main.ts` that registers components and starts the router. From
`reference/hotel-booking/src/main.ts`:

```ts
import { Registry, Messages } from "@qloom/core";
import { registerBuiltins } from "@qloom/components";
import { SessionStore } from "@qloom/runtime";
import { Router } from "@qloom/router";
import { Layout } from "./components/Layout";
import layoutTemplate from "./components/Layout.tml";
import { Index } from "./pages/Index";
import indexTemplate from "./pages/Index.tml";
// … more pages/components …

registerBuiltins();                                            // if/loop/form/textfield/zone/…
Registry.registerComponent("layout", Layout, layoutTemplate);  // this app's own components
Messages.configureMessages({ "no-result": "No hotels found." }); // message: catalogue (optional)

const app = document.querySelector("#app")!;
void SessionStore.initPersistence().then(() => {               // hydrate @Persist/@SessionState first
  new Router({
    routes: [
      { name: "index",  page: Index,  template: indexTemplate },
      { name: "signin", page: Signin, template: signinTemplate },
      // …
    ],
    mount: app,
    indexRoute: "index",
  }).start();
});
```

Key points:

- `.tml` files are **imported as modules** (`import tpl from "./X.tml"`); the Vite plugin compiles them to render programs at build time. Register a component with its template: `Registry.registerComponent("name", Class, tpl)`. Component type names are matched **case-insensitively**.
- A **Page** needs a `route` entry (name + class + template), not a `Registry` call — the router renders it.
- Build tooling is the **Vite plugin** (`qloomVitePlugin` from `create-qloom/vite`, wired in each app's `vite.config.ts`). It compiles `.tml` and generates the `dal/*` data client into a gitignored `.qloom/` cache.

## Where to look for working examples

- `examples/hello` — the walking skeleton: a custom component, `if`/`loop`, an `EventLink` refreshing a `Zone`.
- `examples/forms` — `Form`, validation, `Errors`, two-way binding, PRG, a multi-step wizard.
- `examples/data` — `Grid`, `BeanDisplay`, `message:`, the generated data client against a mock `fetch`.
- `examples/router` — URL-persisted state, back/forward, deep-linking.
- `reference/hotel-booking` — the fullest app: Index, Signin, Signup, Settings, View, Book (wizard), Search (Grid + Ajax zone). The gold standard for real Qloom patterns.

When unsure how a feature is used, **grep these for a working `.tml` + class pair** before writing new code.
