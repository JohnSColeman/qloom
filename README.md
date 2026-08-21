<p align="center">
  <img src="images/qloom-icon.png" alt="Qloom logo" width="150" height="150">
</p>

<h1 align="center">Qloom</h1>

A **faithful, client-side port of Apache Tapestry 5's programming model** to
TypeScript — not a framework "inspired by" it. Tapestry `.tml` templates are
consumed **byte-for-byte unchanged**; pages and components are plain TS classes
with decorators standing in for Tapestry's annotations. There is no JSX and no
server round-trip for rendering — the "Tapestry server" becomes a runtime engine
living in the browser that produces live DOM.

> **Beta** (`0.1.0-beta.1`). Qloom is feature-complete for its intended shape —
> auth-gated, data-driven SPAs (CRUD, forms, wizards), proven by a full Tapestry
> reference app ported end-to-end. The API may still change before `1.0`; pin an
> exact version. Published under the npm `beta` dist-tag.

## Live demo

The reference **hotel-booking** app runs entirely in your browser (its API is an
in-browser mock) — **try it at [johnscoleman.github.io/qloom](https://johnscoleman.github.io/qloom/)**.
Log in with `JohnDoe` / `secret`, or register a new account. It's the same faithful Tapestry port
that backs the parity gate, deployed as a static SPA.

## Documentation

All docs are Markdown, read them right here on GitHub.

**Build with Qloom** — the guides (they double as AI-agent authoring skills, but read fine as prose):

| Guide | Covers |
|---|---|
| [Writing pages](./.agents/skills/writing-pages/SKILL.md) | `Page` classes, `@Property`, activation context, `@Persist` |
| [Writing components](./.agents/skills/writing-components/SKILL.md) | `Component` classes, `@Parameter` two-way binding, blocks |
| [Authoring templates](./.agents/skills/authoring-templates/SKILL.md) | the `.tml` dialect — `${…}`, `t:` components, bindings, i18n |
| [Using components](./.agents/skills/using-components/SKILL.md) | the built-in library and how to invoke it |
| [Forms & validation](./.agents/skills/forms-and-validation/SKILL.md) | `Form`, fields, `@Validate`, errors, PRG |
| [Routing & URL state](./.agents/skills/routing-and-url-state/SKILL.md) | routes, `onActivate`/`onPassivate`, reconstructability |
| [Data access](./.agents/skills/data-access/SKILL.md) | the OpenAPI/GraphQL-generated client + `ApiError` |
| [Render lifecycle](./.agents/skills/render-lifecycle/SKILL.md) | render phases and the return-value protocol |

**Reference:** [Component coverage](./COMPONENT-REFERENCE.md) · [Annotation coverage](./ANNOTATIONS.md)

**Design & project:** [Design + roadmap (PLAN)](./PLAN.md) · [Reference-app parity](./PARITY.md) · [Backlog](./BACKLOG.md)

## The mental model

Qloom holds two invariants that make it a *port*, not a lookalike:

1. **Fidelity.** Mechanically translating a Tapestry page/component from Java to
   TS — same annotations, method names, structure — with its `.tml` **unchanged**
   renders and behaves identically.
2. **Reconstructability.** A page is always reconstructable from **(URL
   activation context) + (`@Persist` storage) + (backend API)** — *never* from
   in-memory state alone. This is what keeps the back button, reload, and deep
   links correct: genuine navigational state lives in the URL
   (`onActivate`/`onPassivate` / `@PageActivationContext`), not in a hidden
   client store. Tapestry's server-statelessness plumbing (`t:formdata`,
   EventLink context) is *deleted* because the page instance is alive in memory —
   but the navigational state stays bound to the URL.

The one deliberate divergence from Tapestry is **data access**: instead of a
server DAO, Qloom generates a fully-typed client from an OpenAPI contract at
build time (the Vite plugin).

## Error handling

Where Tapestry renders a server-side `ExceptionReport` page, Qloom takes a
telemetry-first approach: runtime errors are **observed**, not displayed as a
diagnostic page. `@qloom/core`'s `ErrorReporter` is the internal reporting API.

- **Render boundaries.** The Router wraps each page render and Zones wrap each
  partial (AJAX-style) re-render. A caught error is reported (never leaks as an
  unhandled promise rejection); a global `window` `error`/`unhandledrejection`
  backstop catches the rest. Errors are de-duplicated across boundary + backstop.
- **Page-render failure → a generic error page.** On a full page-render failure
  the mount is replaced with a self-contained "Something went wrong" page (with
  a Reload button — the URL is untouched, so reloading retries the real route). A
  failed *zone* update is scoped: it's reported but doesn't take over the page.
- **Custom error page by convention.** Drop an `error.html` in the app root and
  Qloom uses it instead of the embedded page (fetched lazily on the first error,
  then cached). It **must carry a `data-qloom-error` attribute** on an element —
  that marker is how Qloom tells a real error page from an SPA fallback, since a
  host that rewrites unknown paths to `index.html` (Vite dev, nginx `try_files`)
  returns the app shell with a 200 for a *missing* `/error.html`. Keep it
  self-contained (inline styles). Override the path or opt out with
  `configure({ errorPage: "/oops.html" })` or `errorPage: false`.
- **Default sink is `console.error`.** No configuration required.

Attach a telemetry SDK (or any sink) in your app's `main.ts`:

```ts
import { ErrorReporter } from "@qloom/core";

ErrorReporter.configure({
  report(error, ctx) {
    // ctx: { phase, route, path, activationContext, zoneId, … }
    Sentry.captureException(error, { extra: ctx });
  },
  // sampleRate: 0.25,                    // report a fraction of errors
  // scrub: (ctx) => ({ ...ctx, activationContext: undefined }), // strip PII first
});
```

Each error carries a structured `QloomErrorContext` — the render `phase`, the
`route`/`path`, the URL `activationContext`, and the `zoneId` for zone failures —
so telemetry has real breadcrumbs, not just a stack.

Planned follow-ups (see [PLAN.md](./PLAN.md) §17.0): a built-in `sendBeacon`
endpoint mode (a backend ingests errors without an SDK) and per-component context
enrichment.

## Internationalisation

Static text comes from Tapestry `.properties` message catalogues, consumed
**byte-for-byte** and consolidated per locale at build time by the Vite plugin
(`Foo.properties` → default locale, `Foo_fr.properties` → French, plus an
app-global `src/app.properties`). Templates read them with `${message:key}` /
`message:` bindings, resolved against the **active locale** (falling back to its
base language, then the default locale, then the key).

- **Change language at runtime.** Drop in the built-in `<t:localeselector/>` (a
  `<select>` of the offered locales, labelled by endonym). `Messages.setLocale`
  persists the choice to `localStorage` (the `@Persist('local')` scope, so it
  survives reload — reconstructability) and re-renders the page, since Qloom has
  no fine-grained reactivity.
- **Wire the build-time catalogue** once in `main.ts`:
  ```ts
  import messages from "virtual:qloom/messages";
  Messages.registerCatalogues(messages);
  ```
- **Load or override messages from a backend.** Configure a `MessagesProvider`
  and Qloom will lazy-load a locale's catalogue on first switch and re-fetch it
  on demand — the bundled `.properties` stay the fast default/offline baseline
  that the API *augments or overrides* (e.g. CMS-driven copy):
  ```ts
  Messages.configureProvider({ fetch: (locale) => api.getMessages({ locale }) });
  Messages.announceLocales(["en", "fr", "de"]); // offer locales before they load
  await Messages.reload();                       // re-fetch the active locale, live
  ```

Qloom merges catalogues to **one per locale** at build time, where Tapestry
assembles them per component at runtime — equivalent when keys don't collide (per-component
namespacing is the escape hatch if they ever do).

## Layout

```
packages/
  core/        engine: lifecycle, render, DOM reconciler, event dispatch
  runtime/     Page/Component base classes + decorators — the authoring surface
  compiler/    template → render-program compiler + OpenAPI→TS client (offline)
  router/      history binding, onActivate/onPassivate, URL state
  data/        zero-dependency fetch runtime the generated client calls
  components/  built-in component library (48 of 57 Tapestry components)
  validation/  annotation-driven form validation (@Validate + validators)
create-qloom/   the Vite plugin + the `npm create qloom` project scaffolder
examples/       feature demos that double as per-feature test gates
  hello/         walking skeleton — panel, if/loop, eventlink + zone
  forms/         Form: two-way binding, validation, Errors, PRG, Wizard
  data/          Grid, BeanDisplay, messages, spec-driven data client
  router/        history binding + URL-persisted state
reference/
  hotel-booking/ faithful port of Tapestry's tutorial app — the parity gate
test/
  component-tests/ per-component conformance suite (Playwright)
```

## Develop

```sh
pnpm install
pnpm build        # tsc -b across all packages
pnpm dev          # run the hello example (Vite) at http://localhost:5173
```

Tests:

```sh
pnpm test:reference-app                     # hotel-booking parity gate (Playwright)
pnpm test:forms  /  pnpm test:data          # per-feature example gates (Playwright)
pnpm --filter @qloom/component-tests test   # component conformance (Playwright, green lane)
pnpm --filter @qloom/compiler test          # compiler unit suites (node --test)
```

Most gates are Playwright end-to-end; `@qloom/compiler` also carries `node --test`
unit suites for its pure logic (expression pipeline, template-id/event-handler checks).

## Status

**Component library — 48 of 57 Tapestry components implemented.** Beyond the
foundation set, this now includes the full form controls (TextField, Checkbox,
Checklist, Radio, Select, TextArea, DateField, PasswordField, Hidden, Palette),
bean display/editing (BeanDisplay, BeanEditor/BeanEditForm, Property\*), the
output family, `Tree`, `AjaxFormLoop` (+ Add/RemoveRowLink), `LinkSubmit`,
`FormFragment`, and more. See [COMPONENT-REFERENCE.md](./COMPONENT-REFERENCE.md).
The remaining 9 are out of scope by design: mixins (Qloom has no mixin
subsystem), built-in pages, base classes, and SSR/server-only components.

**Conformance harness** (`test/component-tests`): per-component Playwright specs
ported case-for-case from Tapestry's own integration tests — all green, with
documented skips for server-only / mixin / technique cases. Counts and coverage
are tracked in [TEST-PARITY.md](./TEST-PARITY.md) (run `pnpm --filter
@qloom/component-tests test`).

**Reference app** (`reference/hotel-booking`): a faithful port of Tapestry's
tutorial — Index, Signin, Signup, Settings, View, Book, Search — behind a
Playwright parity gate (`pnpm test:reference-app`). Login runs through the
generated `authenticate` operation, with bad credentials shown via `<t:errors/>`.

Framework milestones M0–M6 are complete: M1 `.tml` compiler; M2 component model +
render-phase state machine; M3 events + `Zone` reconciler; M4 router + URL state;
M5 spec-driven data (OpenAPI→TS client, zero runtime deps); M6 forms (two-way
binding, validation, PRG).

Remaining: SSR/hydration (PLAN §16); a mixin mechanism — which would unlock
`Confirm`, `Autocomplete`, `ZoneRefresh`, and `TriggerFragment`.

**Getting started.** The `create-qloom` scaffolder generates a runnable app:

```sh
npm create qloom my-app
cd my-app && npm install && npm run dev
```

It wires the Vite plugin, writes a Router-based `main.ts`, a sample page +
`.tml` + `app.properties`, and syncs Qloom's authoring skills into
`.agents/skills/`. Published under the npm `beta` dist-tag.
