# Qloom — an implementation plan

*A client-side, faithful port of Apache Tapestry for TypeScript. No JSX, no server round-trip for rendering. Templates are Tapestry `.tml` markup, unchanged; pages and components are plain TS classes.*

---

## 1. What Qloom is (and isn't)

**Source of truth:** Apache Tapestry's programming model — its template-as-HTML weaving, its page/component lifecycle, its convention-over-configuration, and its `onActivate`/`onPassivate` URL-state discipline.

**Lens:** that model, reinterpreted as a browser SPA. The "Tapestry server" becomes a runtime engine living in the browser. Rendering produces **live DOM** with component instances kept alive alongside it, not a serialised HTML string sent over a wire.

**A developer writes exactly two kinds of artefact:**

1. **A TypeScript class** — a `Page` or a `Component` (plain classes, Tapestry annotations as decorators).
2. **A template** — a Tapestry `.tml` file: HTML with `t:`-namespaced elements/attributes and `${...}` expansions, weaving the markup into its class.

**Qloom is deliberately NOT:**
- A reactive-signals framework (granularity is the **Zone**, not the signal — at least in v1).
- A data/persistence layer. Rendering moves to the client; **business logic and persistence live behind a real API**, reached through the OpenAPI-generated client (§10). Qloom renders; it does not own your database.
- A JSX/virtual-DOM authoring model. Templates stay HTML; designers can open them.

---

## 2. Prime directive: Tapestry fidelity

Qloom is a **faithful, feature-complete port of Tapestry's client-facing programming model** — not a framework merely "inspired by" it. The binding contract:

> Take a Tapestry page or component, mechanically translate the class from Java to TypeScript (same annotations, same method names, same structure), keep its `.tml` template **byte-for-byte unchanged**, and it must render and behave **identically** in Qloom.

Concretely, Qloom preserves, unchanged:

- **The template dialect** — the `t:` namespace, `${…}` expansions, and every binding prefix (`prop:`, `literal:`, `message:`, `var:`, `block:`, `component:`, `context:`, `asset:`, `validate:`, `translate:`, `symbol:`), component-by-element and `t:type`/`t:id`, `t:mixins`, informal parameters, `<t:block>`/`<t:body>`/`<t:container>`.
- **The component library** — same component names and parameters: `Form`, `TextField`, `Select`, `Checkbox`, `Loop`, `If`/`Unless`, `Zone`, `EventLink`, `ActionLink`, `PageLink`, `Errors`, `BeanEditForm`, `Grid`, … (ported incrementally — see milestones).
- **The class model** — render-phase annotations (`@SetupRender`, `@BeginRender`, `@BeforeRenderTemplate`, `@BeforeRenderBody`, `@AfterRenderBody`, `@AfterRenderTemplate`, `@AfterRender`, `@CleanupRender`), event handling (`@OnEvent` **and** the `on<Event>From<Component>` naming convention), `@Property`, `@Parameter`, `@Persist`, `@Inject*`, `@Environmental`, `@InjectComponent`, `@InjectPage`, `@ActivationRequestParameter`.
- **The lifecycle semantics** — activation/passivation, event bubbling up the *component* tree, render-phase return-value control flow, parameter binding direction.

**Where fidelity is impossible** (server-only concerns), Qloom substitutes a like-for-like client analogue and documents the seam:

- No JVM, no Tapestry-IoC service graph, no Hibernate, no server page pool. **Data access is the one deliberate divergence:** rather than port the injected DAO, Qloom generates a fully-typed client from an OpenAPI contract (§10) — convention-over-configuration taken further than Tapestry goes. The page/component/template model stays faithful; the data seam is where Qloom improves on Tapestry instead of mirroring it.
- Server-only annotations (`@Inject` of JDBC/Hibernate services, `@CommitAfter`, security realms) have no direct analogue; the OpenAPI client + backend is the boundary.
- `@Property` in Tapestry generates accessors because Java fields aren't directly bindable; TS fields are, so Qloom's `@Property` *registers* the field (and later drives dirty-tracking) rather than synthesising a getter/setter. Template-visible semantics are identical; the mechanism differs.

"Where possible" is the operative clause: parity with the *page / component / template* model is the hard requirement; parity with Tapestry's *server IoC and persistence* is explicitly out of scope and bridged by the OpenAPI-generated client (§10).

**Canonical source.** The canonical source is Apache Tapestry 5 on GitHub — [apache/tapestry-5](https://github.com/apache/tapestry-5). Port from it, don't reconstruct from memory — component `@Parameter` signatures, render-phase semantics, and the `.tml` grammar are read from the `tapestry-core` module (`corelib/components`, `corelib/base`, `annotations`, `internal/services/TemplateParser*`).

---

## 3. The two motives we must keep separate

Tapestry encodes state into URLs and hidden fields for **two conflated reasons**. The port treats them oppositely:

| Tapestry mechanism | Motive | Qloom treatment |
|---|---|---|
| `EventLink` context, `t:formdata` hidden field | Server statelessness plumbing — the instance was thrown away between requests | **Delete.** The instance is alive in memory; event handlers call the component directly. |
| `onActivate` / `onPassivate` context | Genuine navigational state that belongs in the address bar | **Keep — it's the headline feature.** Two-way binding between page state and the URL. |

**The invariant that keeps us honest:**

> A page must be fully reconstructable from **(URL activation context) + (persistent storage for `@Persist`) + (backend API via the generated client)** — never from in-memory state alone.

Honour it and reload / deep-link / share-a-link Just Work — Qloom SPAs are *better behaved* on back-button and refresh than a typical React app. Cheat, and we've rebuilt a fragile SPA and thrown away the reason to base this on Tapestry.

---

## 4. Templates: Tapestry `.tml`, unchanged

A template is a Tapestry `.tml` document, consumed **as-is**:

- **Component elements/attributes** — `<t:loop>`, `<div t:type="if" t:test="expr">`, invoking components from the registry.
- **Expansions** — `${property.expr}` in text and attributes; Tapestry's property-expression language over the class instance.
- **Binding prefixes** — `prop:`, `literal:`, `message:` (i18n), `context:`, `block:`, `component:`, etc.
- **Parameter bindings** — passing values into child components by name, formal and informal.

Example — `Login.tml`:

```html
<t:form t:id="form">
  <t:errors/>
  <label>Email <input t:type="textfield" t:value="email"/></label>
  <label>Password <input t:type="passwordfield" t:value="password"/></label>
  <button type="submit">${submitLabel}</button>
</t:form>
```

`Login.ts`:

```typescript
export class Login extends Page {
  @Property email = "";
  @Property password = "";
  @Property submitLabel = "Sign in";

  onSuccessFromForm() {          // event "success" from component "form"
    return authApi.signin({ email: this.email, password: this.password })  // generated client (§10)
      .then(() => this.navigate(Dashboard));
  }
}
```

Convention: `Login.ts` ↔ `Login.tml`, event handler `onSuccessFromForm` = event `success` from component id `form`. The `.tml` above is exactly what Tapestry would render.

---

## 5. Compilation model — offline, not runtime

Two phases, and which is which is the whole performance story.

**Compile time (build tool):**
- Parse each `.tml` template; resolve `t:` elements against the component registry.
- Compile each `${expr}`/binding into a closure over the instance.
- Emit, per template, a **render program**: a JS module exporting a function `(instance, parent) => renderResult` that builds and later *patches* DOM. No runtime template interpretation, no general vdom for static structure. (This is how Svelte/Solid/Marko beat React.)

**Runtime:**
- Engine instantiates the class, runs the render program, wires events.
- Re-render of a **Zone** re-runs one component's render phase through a **small reconciler** that patches the subtree without destroying focus/scroll/input state. That reconciler is the one React-shaped thing we can't dodge — but it lives *inside the engine*, invisible to the developer.

---

## 6. A fresh client-side engine — no server to port

Recorded so we don't relitigate it: Qloom does **not** reuse the JVM Tapestry engine. Pages and components are plain TypeScript, and templates compile **offline to JS render functions** (§5) — so there is no server engine to port and no template interpreter to ship. The runtime is a small, plain-JS engine that runs those render programs and patches the DOM. Everything runs client-side (§12).

---

## 7. Lifecycle, render phases & events — faithful annotations

Port Tapestry's render phases per component, in order:

```
setupRender → beginRender → beforeRenderTemplate → beforeRenderBody
            → afterRenderBody → afterRenderTemplate → afterRender → cleanupRender
```

A component overrides none by convention. Phases are declared either by **annotation** (`@BeginRender someMethod() {…}`) or by **convention method name** (`beginRender() {…}`) — both, to stay faithful.

**The render-phase return-value protocol (fidelity-critical).** Tapestry components contain *no* loops or conditionals over their own body — the **engine** drives rendering by re-invoking phases based on their return values. Confirmed from the canonical `Loop`/`AbstractConditional` source:
- `@SetupRender` / `@BeforeRenderBody` returning `false` **skips** the body (this is how `If` omits its body and `Loop` renders nothing when empty); `true`/void proceeds.
- `@AfterRender` returning `false` **re-runs from `@BeginRender`** — this is how `Loop` iterates (`after()` returns `hasNext() ? false : null`); returning `null`/`true` advances to `@CleanupRender`.
- A phase may return a `Block`/renderable to render in place of the body (e.g. `If`'s `then`/`else`).

So Qloom's `core` needs a **render-phase state machine** that honours these returns, not just linear phase calls. My M1 compiler emits a native `for` for `<t:loop>` as a shortcut; M2 replaces that with `Loop` as a real component driven by this protocol, so *user-authored* components with custom phases behave identically. Built-ins (`If`, `Loop`) are ported to their exact `@Parameter` signatures (`If`: `test`/`then`/`else`; `Loop`: `source`/`value`/`index`/`element`/`empty`) minus the form-state plumbing (§3).

**Events:**
- **Component-tree bubbling.** Qloom events bubble up the *component* hierarchy (not the DOM tree) until a handler returns non-`undefined`, exactly like Tapestry. Declared via `@OnEvent(component="form", value="success")` **or** the `on<Event>From<Component>` naming convention.
- **`EventLink`/`ActionLink` = real href + fast-path.** Renders an actual `href` that resolves via the router on middle-click / open-in-new-tab / cold reload, while ordinary left-click is intercepted and dispatched in memory (`onDelete(item.id)` called directly). Web-native semantics *and* no round-trip.
- **Page/page-level:** `onActivate(context)`, `onPassivate(): context`, activation-request-parameter binding.

---

## 8. Router & URL state

The `onActivate`/`onPassivate` pair becomes a two-way binding with the address bar:

- `onActivate(context)` — fires when the router resolves the route; context parsed from path segments/query. May be **async** (see §10 — pages `await` the generated client here).
- `onPassivate(): context` — returns canonical state; whenever it changes the router does `pushState`/`replaceState` to keep the URL honest.
- Page discovery by convention: `Product.ts` ↔ route `/product/...`, activation context = trailing segments.
- **Redirect-after-POST** analogue: after a successful mutation, `pushState` to a clean URL.

**Security note baked in:** URL/`@Persist` state is pure UX convenience — no encryption (there's no trust boundary inside the user's own browser). Therefore **the API must authorise every mutation independently.** The client is untrusted; it always was.

---

## 9. Decorators & annotations — the Tapestry mapping

Tapestry annotations map to TS decorators almost 1:1. **We use legacy (`experimentalDecorators`) decorators**, not Stage-3 — esbuild (via Vite) transforms them reliably today, and the prototype-level field decorator maps cleanly onto Tapestry's annotation model. Set: `experimentalDecorators: true`, `useDefineForClassFields: false`. (No `emitDecoratorMetadata` is needed — the data layer is codegen-driven, not injection-by-type; §10.)

- `@Property` — a bindable, template-readable field.
- `@Parameter({ required, allowNull, defaultPrefix, value })` — a component input parameter (two-way binding; unbound fields fall back to storage/`value`). `required`, `allowNull`, `defaultPrefix`, and `value` are honoured; `cache`/`principal`/`autoconnect`/`name` are not (largely N/A to Qloom's lazy-binding model). See ANNOTATIONS.md.
- `@Persist('session' | 'local' | 'flash', { key })` — persists a field across reloads/navigations, keyed by **class + component id + field** (mirroring Tapestry's page:component:field). `'flash'` survives exactly one activation then is discarded (Tapestry FLASH); `{ key }` sets a stable class key for minified builds. Backed by the **same encrypted, in-memory-cached store** as `@SessionState` (AES-GCM); Proxy-wrapped so nested mutations re-persist and identity is stable. Needs `initPersistence()` awaited at startup (hydrates session/local; flash is in-memory, aged by a router navigation hook). `clearSession()` drops session-scoped state (SSOs + `@Persist('session'|'flash')`) — the browser analogue of Tapestry's session invalidation on logout; `@Persist('local')` is kept.
- `@SessionState(SsoClass, { persist, create })` — a session state object (SSO). **Takes the SSO class**: keyed by `SsoClass.name` (mirroring Tapestry's `ssoClass.getName()`), auto-created via `new SsoClass()` (Tapestry's `create=true`), and revived to its class on reload. Shared across pages by type. `create:false` reads without creating and defines a companion `<name>Exists` boolean (Tapestry). Backed by an in-memory registry (survives SPA navigation — the real fix for "state lost on nav") and, unless `persist:false`, mirrored to `sessionStorage` **encrypted** (AES-GCM via Web Crypto). `persist:false` keeps it in-memory only — for transient/sensitive graphs (e.g. an in-progress booking with card data) that must not touch browser storage. Encryption is at-rest obfuscation + tamper-evidence, **not** confidentiality against the user (a browser holds its own key — see §8's security note); never put a real secret in client state. (Passing the *class* sidesteps TS type erasure — a class is a runtime value, so no `emitDecoratorMetadata`/`reflect-metadata` is needed.)
- Render phases — `@SetupRender`, `@BeginRender`, `@BeforeRenderBody`, `@AfterRenderBody`, `@AfterRender`, `@CleanupRender` (+ the rest), or convention method names.
- `@OnEvent({ component, value })` — event handler (or `on<Event>From<Component>`).
- `@InjectPage(Dashboard)`, `@InjectComponent('form')`, `@InjectContainer`, `@Environmental`, `@Inject` — references and injection.
- `@ActivationRequestParameter('q')` — bind a query parameter to a field.
- **Data layer (§10):** no data decorators — a `dal/*` file declares `defineApi(spec)` and Qloom generates a typed client + schema types from the OpenAPI contract (a conscious divergence from Tapestry, §2).

---

## 10. Data access — spec-driven client generation (the `dal/`)

### 10.1 Rationale & the divergence from Tapestry
Tapestry pages obtain server data through an `@Inject`-ed service (in hotel-booking, a Hibernate-backed `CrudServiceDAO`). Qloom cannot port that faithfully — there is no database, no IoC graph, and, more to the point, **this is the one seam where mirroring Tapestry costs us rather than helps**. So Qloom **consciously diverges** here (flagged in §2): instead of hand-declaring a DAO or entity classes, the developer points at an **OpenAPI contract** and Qloom generates a fully-typed client. The contract *is* the source of truth; there is no entity/DAO boilerplate at all. This is convention-over-configuration taken further than Tapestry itself goes.

### 10.2 The `dal/` convention (as built)
By convention an Qloom app has a `dal/` directory holding, per API, a **committed** OpenAPI spec and a one-line re-export of the generated client:

```ts
// dal/hotel-booking.openapi.json   — the contract (committed)
// dal/BookingApi.ts                — the entire hand-written module:
export { api as bookingApi } from "@dal/hotel-booking";
export type { Hotel, User } from "@dal/hotel-booking";
```

No operations, no entity classes, no signatures. The Vite plugin discovers `dal/*.openapi.json`, generates a typed client + schema types into the `.qloom/dal/` cache (§10.4) reached via the `@dal/*` alias, and `configureData({ baseUrl, fetch, headers })` points the client at a backend (or a mock) once, globally.

*(The original sketch used a `defineApi("url")` marker; the as-built convention co-locates a committed spec file instead — the spec is a real artefact to version and diff, and a remote URL would be vendored to a local file for determinism anyway, §10.7.)*

### 10.3 What "somehow fills out the interface" actually is — codegen, not a decorator
The hard constraint (see the feasibility analysis): **TypeScript types are static and file-based.** A decorator cannot add members to a type, cannot be applied to an `interface`, and the editor/`tsc` will never fetch a URL. So the operations and schema types must exist as **generated TypeScript on disk** for the editor to see them. There is no runtime-annotation path; the mechanism is build-time code generation, exactly like Qloom already compiles `.tml` → render programs.

Pipeline (all offline, on the existing Vite-plugin build step):
1. Discover each `dal/*` API and its spec (a URL or a vendored file).
2. Run the generator → emit **schema types + a typed, `fetch`-based client**.
3. Write the output to a **gitignored cache outside the project source** (§10.4).
4. Wire it via `tsconfig` `paths` so the editor and `tsc` resolve it → full autocomplete and valid-syntax checking.

### 10.4 Generated code is boilerplate — never committed
Per the design constraint, generated output is **not** part of the repo. It lands in a cache directory that isn't project source — e.g. `node_modules/.qloom/dal/` (gitignored, tooling-managed), reached from app code through a stable import specifier (`#dal/*` or an `@qloom`-owned `paths` mapping). This mirrors how Prisma (`node_modules/.prisma`), Next (`.next/types`), and SvelteKit (`.svelte-kit`) ship generated types: committed **source** = the spec; generated **artefact** = regenerated on install/dev/build, never versioned. Delete the cache and it rebuilds.

### 10.5 Using it — zero boilerplate in pages
```ts
import { bookingApi, type Hotel } from "../dal/BookingApi";

export class View extends Page {
  @Property hotel!: Hotel;                     // Hotel is a generated schema type

  async onActivate(ctx: readonly string[]): Promise<void> {
    this.hotel = await bookingApi.getHotel({ id: ctx[0]! });   // operation from the spec
  }
}
```

Operation names, parameters, and return types all come from the contract — the editor autocompletes them, and a spec change surfaces as a type error. No `@Entity`, no `find(Hotel, id)`, no DAO.

### 10.6 The dependency stance — as built
Split by layer so the two goals don't conflict:
- **Runtime stays dependency-free.** The generated client uses **native `fetch`** + Qloom's ~1-file `request()` (`@qloom/data`). Nothing ships to the browser but Qloom + generated code.
- **Build-time is also dependency-free — for the controlled subset.** Qloom ships its **own minimal OpenAPI→TS generator** (`@qloom/compiler`, ~150 lines): objects/arrays/`$ref`/enums, path+query params, JSON request bodies, a 200/201 JSON response. Because an Qloom app *authors* its spec (or vendors a snapshot), the subset is enough, and it yields the exact named-operation DX (`bookingApi.getHotel({ id })`) with zero deps — consistent with Qloom hand-rolling its `.tml` compiler rather than pulling a template lib.
- **`openapi-typescript` is the documented drop-in** for *arbitrary/remote* specs that use features beyond the subset (discriminators, `allOf` composition, complex serialisation). It would be a build-time devDependency (like `htmlparser2`), invisible to the bundle. Not needed for the reference app.

Spec format: authored as **JSON** (OpenAPI-native, parsed with `JSON.parse` — no YAML dep). YAML input is a one-dep addition if wanted.

### 10.7 Boundaries & guarantees
- **Async only.** Every operation returns a `Promise`; pages `await` in an async `onActivate` or refresh a Zone on resolution.
- **The backend authorises.** Per §8: the generated client runs in the user's browser. It is UX convenience, never a security boundary; every endpoint authorises independently.
- **Determinism.** A live spec URL changes under you, so a snapshot is **vendored** (committed) and regenerated deliberately — like a lockfile. Offline builds and CI need this anyway. The URL form is a dev convenience that resolves to a pinned copy.
- **Not an ORM.** The client maps calls to endpoints; no identity map, cache, or unit-of-work. Optional future concern.

### 10.8 Packages & the reference app
`@qloom/data` ships the tiny `fetch` runtime (`configureData` + `request`); `@qloom/compiler` ships the minimal generator; the Vite plugin (`create-qloom`) runs it on `buildStart`. **Reference-app note:** hotel-booking has no published spec, so the port hand-authors a committed `hotel-booking.openapi.json` for the hotel/booking/user operations; a mock `fetch` serves seed data. The `.tml`/page model stays faithful; the data seam is where Qloom diverges (§2). *(Proven ahead of the reference port in `examples/data` — see M5.)*

### 10.9 Type-wiring — resolved (M5)
**Option A chosen** and verified: the generated cache module (`.qloom/dal/<name>.ts`) exports the client (`api`) + schema types; `dal/<Name>.ts` re-exports from it via the `@dal/*` alias (Vite) + tsconfig `paths` (editor/`tsc`). Two lines of glue, robust, and `examples/data` **typechecks** — full autocomplete and valid-syntax checking from the committed spec. (B — `defineApi<T>()` — and C — declaration merging into an empty interface — were the alternatives; not needed.)

### 10.10 GraphQL DAL — a second generator (operation-document driven)
A GraphQL client sits alongside the OpenAPI one under the same `dal/` + `@dal/*` machinery, but the authoring unit is a **subdirectory**: `dal/<name>/` holds a vendored `schema.graphql` (type-system definitions) plus the `.graphql` **operation documents** the app authors. The Vite plugin (`create-qloom`) scans those subdirs on `buildStart` and emits `.qloom/dal/<name>.ts` — one typed `api.<Op>(variables)` per named operation, whose result type is exactly the selected subtree.

Why operation-documents rather than schema-only: in GraphQL the **caller's selection set** decides the response shape, so the schema alone can't type a query. Reading the app's operations is the only approach that reproduces the OpenAPI DX (`api.GetFilm({id})` → precise type) and stays tractable against a large vendor schema (it types only selected fields). See the design spec for the two rejected alternatives.

Two deliberate divergences from the OpenAPI client:
- **The generator uses a library, not a hand-roll.** It takes a **build-only `graphql`** (graphql-js) dependency on `@qloom/compiler` — the "arbitrary spec → use the library" branch of §10.6. The OpenAPI generator stayed hand-rolled because the app authors a *micro* subset it controls; GraphQL codegen targets *real vendor schemas*, and graphql-js's `buildSchema`/`parse`/`validate`/`print` give exactly the selection-set→type resolution (non-null/list unwrapping, fragments, inline fragments on interfaces/unions, aliases, `__typename`) that is most error-prone by hand. Nothing GraphQL-related ships to the browser.
- **Operations return `Either<GraphqlError, T>`, not `Promise<T> + throw`.** The caller `.fold`s over success/failure. Any non-empty GraphQL `errors` array ⇒ `Either.left(GraphqlError)` (partial `data` attached to `GraphqlError.partialData`); a network / non-2xx / unparseable response ⇒ a transport `Left`. Never throws for expected failures. Runtime lives in `@qloom/data` (`Either`, `GraphqlError`, `Data.graphql`, `DataConfig.graphqlEndpoint`), zero-dependency like the rest of the package.

Type mapping is nullability-exact (`T!`→`T`, `T`→`T | null`, lists compose); enums → string-literal unions, input objects → interfaces (emitted once, shared), interface/union selections with inline fragments → a discriminated union keyed on `__typename`. An **unmapped custom scalar → `unknown` + a build warning** (refine via `QloomPluginOptions.graphqlScalars`). Fail-loud at build time on anonymous operations, duplicate operation names, `subscription` operations (no transport — out of scope), and any operation that fails `validate(schema, doc)`. Proven end-to-end in **`examples/graphql`**, which vendors the real Star Wars (SWAPI) schema (root type named `Root`, not `Query`) and folds the `Either` over both paths.

---

## 11. Package layout

```
Qloom/
  packages/
    core/        # engine: lifecycle, render, reconciler, event dispatch, DI
    compiler/    # .tml parser + expression compiler → render programs
    router/      # history binding, onActivate/onPassivate, route discovery
    components/  # built-ins: Form, TextField, Loop, If, Zone, EventLink, Errors...
    data/        # defineApi + tiny fetch client (zero runtime deps) + OpenAPI codegen driver
    runtime/     # decorators, Page/Component base classes, public API surface
  create-qloom/   # scaffolding CLI + Vite plugin (invokes compiler)
  examples/
    hello/         # M1–M3: templates, components, events, Zone
    router/        # M4: routing, activation context, @Persist, PageLink
    data/          # M5: OpenAPI spec → generated client → mock backend
    forms/         # M6: two-way binding, validation, Errors, submit + PRG
  reference/
    hotel-booking/ # ported Tapestry app + Playwright gate (§13) — `pnpm test:reference-app`
```

Build tooling: a **Vite plugin** that compiles `.tml` → render-program modules and runs the OpenAPI codegen (§10) for `dal/*` into the gitignored cache.

---

## 12. SSR / hydration — explicitly out of scope (non-goal)

**Qloom is a browser-only SPA. There is no server-side rendering and no hydration — ever.** All rendering happens client-side in the browser; all data is fetched at runtime via the API (`@qloom/data` + the generated `dal/` client). The server (if any) serves static assets and the API only. Do not add a string/Node `MarkupWriter`, a `renderToString`, or a hydration path — they contradict the vision. The `MarkupWriter` interface stays DOM-backed (`DomMarkupWriter`); `currentElement()` always returns a live node.

(Tapestry's template/logic separation would *permit* an isomorphic port, but Qloom deliberately does not pursue it.)

---

## 13. Reference-app test gate

Feature parity is not a claim we make — it's a gate we pass. We port a real,
published Tapestry application, run it in a browser, and assert every page and
component behaves as the Tapestry original does. This is the executable form of
the `PARITY.md` scorecard.

**The application.** `ccordenier/tapestry5-hotel-booking` (Apache 2.0 — see `PARITY.md`), ported under `reference/hotel-booking/`.

**The command.** `pnpm run test:reference-app` boots the ported app (Vite) and drives it with Playwright in a real browser, checking each route and component. Green = parity for every feature the enabled checks cover.

### 13.1 Porting rules
The port is mechanical and constrained, so that "it works the same" is a meaningful claim and not a rewrite:

1. **Java classes → TypeScript classes.** Same class names and structure; annotations kept as close as the Qloom decorator surface allows (`@Property`, `@Inject`, `@InjectComponent`, `@InjectPage`, `@OnEvent`, `@Persist`, render-phase decorators). Method names and event-handler conventions (`on<Event>From<Component>`) unchanged.
2. **`.tml` templates copied verbatim.** Page and component templates are byte-for-byte the originals (attribution retained). If a template must be edited to render, that's an **Qloom bug**, not a port step — that is the entire point of the gate.
3. **A committed OpenAPI spec + mock `fetch` replace the database.** A hand-authored `hotel-booking.openapi.yaml` describes the hotel/booking/user operations; Qloom generates the typed client (§10), and a mock `fetch` serves the seed data. No server, no Hibernate.
4. **Structure preserved.** `pages/`, `components/`, `entities/`, `services/` mirror the original package layout, minus server-only packages.
5. **Server/runtime cruft dropped.** `web.xml`/servlet wiring, `AppModule` bindings that configure server services, Hibernate config, Maven `pom.xml`, WAR packaging — all removed. What remains is the page/component/template/entity surface plus a thin client bootstrap.

### 13.2 Port layout
```
reference/hotel-booking/
  index.html   vite.config.ts   tsconfig.json   package.json
  playwright.config.ts
  src/
    pages/       Index, Search, View, Book, Settings, Signin, Signup   (.ts + .tml)
    components/  Layout, Workspace, HotelClass, YourBookings, AjaxLoader, security/Authenticated
    entities/    Hotel, Booking, User, CreditCardType   (DTOs)
    dal/         BookingApi (defineApi) + hotel-booking.openapi.yaml + seed data + mock fetch
    services/    Authenticator (client stub), app bootstrap/registry
    main.ts      install mock fetch + Router.start()
  tests/
    reference-app.spec.ts   Playwright parity checks, tagged by milestone
```

### 13.3 What the gate checks
Each check corresponds to a `PARITY.md` scorecard row. Per page/route:
- **Renders** — mounts with no console error; expected components present (`Layout`, `Workspace`, …).
- **Behaves** — the interactions that define the app:
  - `Index`/`Search`: enter a query, submit → the results `Zone` updates via Ajax with matching hotels.
  - `View` (`/view/{id}`): activation context resolves → hotel detail shown (generated client `getHotel`).
  - `Book` (`/book/{id}`): booking form; client validation; confirm → confirmation state.
  - `Signin`/`Signup`: form validation; on success, session state set (`Workspace` shows the user).
  - `Settings`: the user-settings form round-trips.
  - Navigation: `PageLink`/`EventLink` move between pages; back/forward + reload reconstruct state (the §3 invariant).

### 13.4 Incremental enablement
The suite was **tagged by milestone** and enabled as each landed — a milestone's Definition of Done included "its reference-app checks pass". With every page now ported it is complete: `pnpm run test:reference-app` builds the workspace, boots the app via Vite, and runs the full Playwright suite green (current count in the PARITY.md scorecard header), alongside the per-feature example gates.

---

## 14. Milestones

**M0–M6 — complete.** ✅ The framework is feature-complete for the page/component/template model. In order: **M0** walking skeleton (the `core` engine renders a static `Page` to the DOM); **M1** the `.tml`→render-program compiler + Vite plugin; **M2** the component registry, `@Parameter` binding, and the render-phase state machine honouring the return-value protocol (§7); **M3** container-tree event bubbling (`triggerEvent`), `EventLink`/`ActionLink`, and the focus-preserving `Zone` reconciler; **M4** `@qloom/router` — route-by-convention, `onActivate`/`onPassivate` URL sync, `@Persist`, and deep-link/back-button reconstruction (§3); **M5** spec-driven data — the OpenAPI→TS generator, the zero-dep `@qloom/data` runtime, and the gitignored `.qloom/dal/` cache (§10); **M6** forms — `Form` two-way binding, validation, `Errors`, and PRG. Each landed with its example gate green (`examples/{hello,router,data,forms}`) and its reference-app checks passing (§13.4). The full hotel-booking app is ported page-for-page against unmodified `.tml` — see **PARITY.md** for the scorecard, **BACKLOG.md** / **ANNOTATIONS.md** for the remaining component/annotation parity gaps.

**M7 — DX polish.** 🟡 *In progress.* The `create-qloom` **scaffolder is done** (`scaffold(dir)` + the `npm create qloom` CLI — copies a Router-wired template, pins `@qloom/*`, installs the skills); packages **ship to npm as a beta** (`0.1.0-beta.1`, `beta` dist-tag, `LICENSE`). The hotel-booking reference app is packaged as a static SPA and auto-deployed to GitHub Pages (`.github/workflows/pages.yml`). Still open: error overlays, source maps back to `.tml`, a dedicated examples app.

**Agent-skills distribution.** ✅ Qloom's authoring skills (`.agents/skills/*/SKILL.md`) ship to consuming apps via **`@qloom/skills`** — a package bundling the skill files plus `syncSkills()` and a `qloom-skills sync` CLI that copies them into the app's `.agents/skills/` (agent harnesses discover skills from the project, not from `node_modules`). Re-run after upgrading Qloom so guidance tracks the API. The scaffolder runs it on init (`create-qloom`'s `installSkills`). Canonical source stays repo-root `.agents/skills/`; `@qloom/skills/scripts/bundle.mjs` copies it in at publish.

**Later — a signals layer over Zones; generated-client response caching.** (SSR/hydration is a non-goal — §12.)

---

## 15. Resolved design questions

The open questions from the design phase, and how they landed:

1. **Expression language** — ✅ the *full* Tapestry property-expression grammar (§4/§9), via a hand-written `tokenizeExpression → parseExpression → emitExpression`/`emitConduit` pipeline in `@qloom/compiler` (property chains, `?.`, method calls, literals, `[…]`/`{…}`, `a..b` ranges, `!`). Zero runtime deps. Divergences: case-sensitive identifiers; no arithmetic/comparison operators (neither does Tapestry's PEL).
2. **Reconciler** — ✅ keyed direct-DOM patching (no vdom); key-aware (`data-key`/`id`) since the hardening pass.
3. **Reactivity trigger** — ✅ explicit `Zones.refreshZone`, not an auto-dirty `@Property` setter.
4. **OpenAPI type-wiring** (§10.9) — ✅ option A (generated re-export); the app typechecks from the committed spec.
5. **Codegen pipeline** — ✅ a gitignored `.qloom/dal/` cache generated on Vite `buildStart`, exposed via the `@dal/*` alias; the spec is committed (pinned, offline/CI-safe).
6. **i18n** — ✅ per-locale catalogues with runtime **language switching**: `Messages.configureLocale(locale, …)` / `setLocale` (active locale negotiated from persisted value → `navigator.language` → default; **persisted to `localStorage`** — the `@Persist('local')` scope — so it survives reload); a built-in `LocaleSelector`; the Router re-renders the page on change (no fine-grained reactivity). `message(key)` falls back active → base language → default → key. Static text comes from **Tapestry `.properties` files, consolidated per locale at build time** (the Vite plugin scans `src/**/*.properties`, groups by `_<locale>` suffix, and exposes `virtual:qloom/messages` → `Messages.registerCatalogues`) — consumed byte-for-byte like `.tml`. Qloom merges to one catalogue per locale (Tapestry assembles per-component at runtime); equivalent when keys don't collide, with per-component namespacing as the escape hatch. Catalogues may also come from a **backend at runtime** — `Messages.configureProvider({ fetch(locale) })` lazy-loads a locale on switch and `Messages.reload()` re-fetches it live (CMS-style overrides), with the bundled `.properties` as the offline baseline the API augments. Remaining: parameterized `Messages.format(key, …args)`.

---

## 16. Status & next step

**M0–M6 complete; reference parity complete.** The framework is feature-complete for the page/component/template model, routing/URL-state, spec-driven data, and forms; every page of the hotel-booking app is ported against its **unmodified `.tml`**. The live gates run green — reference-app parity, the per-feature example gates, and the component-conformance suite (current counts in **PARITY.md**; run via the `test:*` scripts documented in **CLAUDE.md**).

**Outstanding / next:** all open work — M7's remaining DX polish (error overlays,
`.tml` source maps, a dedicated examples app), the §17 future capabilities below, and
the component/annotation/validation parity gaps — is tracked in one place,
**[BACKLOG.md](BACKLOG.md)**. The reference port itself has no remaining backlog.

SSR/hydration remains a **non-goal** (§12) — Qloom is browser-only by design.

---

## 17. Future capabilities

Speculative, not scheduled — captured so the design intent isn't lost. Each is a known-desired direction, not a committed milestone.

### 17.0 Error reporting — deliberate deviation from `ExceptionReport` (MVP landed)

Tapestry renders a server-side `ExceptionReport` page (full stack trace + environment) on an uncaught request exception. Qloom **deviates**: errors are *observed via telemetry*, not rendered as a diagnostic page. The **MVP** (`@qloom/core` `ErrorReporter`) is in place: a pluggable sink (`configure({ report, sampleRate, scrub })`, default `console.error`), render boundaries in the Router (page render — reports, then shows a **generic** error page, never leaks an unhandled rejection) and Zones (partial re-render — reports, scoped), plus a global `window` `error`/`unhandledrejection` backstop, with dedup. The **`/error.html` convention** is also done: an app-root file (lazily fetched + cached) overrides the embedded page — accepted only if it carries a `data-qloom-error` marker, which is what distinguishes a real error page from an SPA fallback (a host rewriting unknown paths to `index.html` 200s the app shell for a missing `/error.html`); override with `configure({ errorPage })` / `false`.

Follow-ups (not yet done): a built-in **`endpoint` beacon** mode (`navigator.sendBeacon`, so a backend ingests errors without an SDK), and **per-component context enrichment** (tag the thrown error with `componentType`/`componentId`/`phase` via `invokePhase`).

### 17.1 Compiled CSS (Less / Sass / PostCSS / Tailwind)

Most apps today author CSS through a compiler, not raw `.css`. The foundation is in place: the `@Import` decorator (the ported Tapestry annotation — a component/page declares `stylesheet`/`library` assets, resolved and injected once into `<head>` at render via the `Assets` static class) gives components a way to *declare* their assets. But `@Import` injects a **runtime** `<link href>` from a literal path string, whereas compilation is inherently **build-time** — so the two can only meet in the **Vite plugin**, which already owns build-time (`.tml` → render program, OpenAPI → typed client). CSS compilation is a natural third job, and it is *on-model*: Tapestry's own `tapestry-webresources` compiled LESS and minified assets. Three tiers, increasing in Qloom-nativeness:

- **Tier 1 — lean on Vite (works today, zero Qloom code).** Vite already compiles `.less`/`.scss`/PostCSS/Tailwind. An author `import`s a stylesheet in an entry or component `.ts` module and Vite compiles, hashes, and injects it. **Tailwind is the standout**: a `.tml` with `class="flex gap-2"` is byte-for-byte-valid Tapestry markup (Tapestry never cared what class names *mean*), so it "just works" with one config line pointing Tailwind's content scanner at `**/*.tml`. Cost: the CSS is bundled by Vite's module graph, not *declared per-component* via `@Import` — off-model for "this component owns these assets", but fine for app-global chrome.
- **Tier 2 — `@Import` compiles source assets (the faithful middle).** Teach the plugin to intercept `@Import({ stylesheet: ["context:/styles/app.less"] })`: statically find the literal path, compile it at build time, and rewrite the injected URL to the **content-hashed** compiled asset. Keeps the Tapestry authoring surface *and* fixes a latent wart — a runtime literal `<link href="/static/style.css">` skips Vite's fingerprinting/cache-busting; routing `@Import`'d stylesheets through the plugin earns hashed filenames for free. Price: the plugin must parse TS to find the decorator's static string args (only workable because they are literals).
- **Tier 3 — co-located component styles (most Qloom-native).** Tapestry's convention is that a component's assets live beside it. Qloom already pairs `Layout.ts` + `Layout.tml`; the plugin could auto-associate a sibling `Layout.less`, compiling and injecting it when the component first renders — no `@Import` needed. Best DX; makes "a component is a folder of `.ts` + `.tml` + `.less`" the natural unit.

**The sharp edge — scoping vs. the byte-for-byte `.tml` invariant (§2/§4).** CSS Modules and Vue-style scoped styles produce *hashed* class names that exist only as a JS object; but a `.tml` carries a *literal* `class="hotel"` with no JSX to interpolate `styles.hotel` into — so scoped/module CSS cannot work without either breaking the byte-for-byte rule or adding a mapping layer. Global-class pipelines (plain CSS, Less/Sass, Tailwind) slot in cleanly because literal class names stay literal. The one reconciliation that preserves the invariant: since the plugin compiles **both** the `.tml` and the `.css`, it could hash them **together** — rewriting the class in the emitted *render program* and the matching selector in the compiled CSS in lockstep, leaving the source `.tml` untouched on disk. Doable but invasive; defer until demand exists.

**Direction.** Today: recommend Tailwind (one config line) or a global Less/Sass entry import — both already work via Vite. Faithful next step: grow the Vite plugin to compile `@Import`'d source stylesheets and/or co-located `Component.less` into hashed assets, mirroring `tapestry-webresources`. Defer CSS Modules / scoping until something demands it — the twin-compile-hashing trick is the escape hatch if it ever does.
