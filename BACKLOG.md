# Qloom — Backlog

The **single source of open work.** Everything Qloom still intends to do — framework
gaps, deferred features, deliberate divergences from Apache Tapestry 5 — is tracked
here. The other docs describe what *exists*: `PLAN.md` (design + roadmap),
`ANNOTATIONS.md` (annotation coverage), `PARITY.md` (reference-app scorecard),
`COMPONENT-REFERENCE.md` (component coverage), and `TEST-PARITY.md` (test-port
ledger). When one of those records a gap, the actionable item lives here.

**Status key:** `[open]` not started · `[deferred]` planned, not scheduled ·
`[blocked]` waiting on a larger feature · `[note]` intentional divergence / non-goal,
recorded so the backlog stays honest. Recently-closed work is kept briefly at the
bottom for context.

---

## 1. Framework & DX

*Source: `PLAN.md` §14 (M7), §15, §17.*

- `[open]` **Dev error overlays** (M7) — a development-time overlay for render/compile
  errors.
- `[open]` **Source maps back to `.tml`** (M7) — map a runtime render error to the
  original template line, not the emitted render program.
- `[open]` **Dedicated examples app** (M7) — a browsable showcase beyond the
  per-feature `examples/*` gates.
- `[open]` **`Messages.format(key, …args)`** — parameterized message interpolation
  (`PLAN.md` §15 #6). The per-locale catalogue + runtime language switching landed;
  positional/`{0}`-style argument substitution is the remaining piece.
- `[open]` **Error-reporting follow-ups** (`PLAN.md` §17.0) — a built-in `endpoint`
  **beacon** mode (`navigator.sendBeacon`, so a backend ingests errors without an
  SDK), and **per-component context enrichment** (tag the thrown error with
  `componentType`/`componentId`/`phase` via `invokePhase`). The `ErrorReporter` MVP
  and the `/error.html` convention are done.
- `[open]` **`Messages` lazy-load flash mitigation** — when a locale is lazy-loaded via
  a `MessagesProvider` on first switch, keys briefly resolve to the fallback before the
  fetch resolves. Decide on a suspense/placeholder story.
- `[deferred]` **Compiled-CSS tiers** (`PLAN.md` §17.1) — teach the Vite plugin to
  compile `@Import`'d source stylesheets and/or co-located `Component.less` into
  content-hashed assets (mirroring `tapestry-webresources`). Tier 1 (lean on Vite /
  Tailwind) works today; Tiers 2–3 are the faithful next steps. CSS Modules / scoping
  deferred until demand exists (the twin-compile-hashing trick is the escape hatch).
- `[deferred]` **A signals layer over Zones**, and **generated-client response
  caching** (`PLAN.md` §14 "Later"). Speculative.

---

## 2. Validation subsystem

*Source: `ANNOTATIONS.md` §3.4, §5.2. Validation M2–M5 were backlogged from the M1
delivery.*

- `[open]` **Extend the `@Validate` validator registry** — add `regexp`, `min`, `max`,
  `checked`, `unchecked`, `none`, and numeric length bounds (M1 shipped `required`,
  `minlength`, `maxlength`, `email`). This unblocks both the bean-model metadata work
  (§3) and entity validation (below). Register via `Validators.register(...)`.
- `[open]` **Entity / bean validation** (validation M2) — a mechanism to read
  constraints declared on generated/entity types (`@NotNull`→`required`,
  `@Size`→`minlength/maxlength`, `@Min`/`@Max`, `@Pattern`→`regexp`, `@Email`) and
  feed them into the same `Composite` pipeline the component-level `@Validate` already
  uses.
- `[open]` **Form-level `t:validate="object"`** (tapestry-beanvalidator) — currently
  **unported**; the reference `Book` form skips its credit-card cross-field validation
  as a result. Investigated; wire it once entity validation lands.

---

## 3. Annotations

*Source: `ANNOTATIONS.md`. Ranked by hotel-booking usage and leverage; the full ❌
inventory with per-annotation notes stays in that doc.*

- `[open]` **`@Log`** — method entry/exit/exception logging. Trivial decorator; used
  by hotel-booking.
- `[open]` **`@Cached`** — memoise a getter for the duration of a render. Common in
  real pages.
- `[done]` **Page lifecycle** — `@PageLoaded` / `@PageAttached` / `@PageDetached` /
  `@PageReset` (+ their convention method names), resolved via `LIFECYCLE` + a new
  `core/invokeLifecycle`. Fire order in `renderPage`: loaded/attached (before
  `onActivate`) → `onActivate` → detach outgoing → reset → render. The value is
  **`@PageDetached`** (a navigate-away teardown hook Qloom lacked — the Router calls
  it on `this.current`); `@PageReset` fires **after** `onActivate` to reset *persistent*
  state on a fresh visit. **Not** a reconstructability mechanism — per-nav
  re-instantiation already resets transient state. In Qloom's poolless model
  `@PageLoaded`/`@PageAttached` coincide. Verified by `PageLifecycle.spec.ts`.
  **Two things this surfaced (kept):** (1) `invokeLifecycle` returns
  `void | Promise<void>` and the Router awaits *only* a thenable — a no-op/sync callback
  must not introduce a microtask before `onActivate`, or it reorders startup work a page
  does in `onActivate` (this broke `MessagesApi` cold-load until fixed). (2) a
  **render-token guard** in `renderPage`: a render that finds a newer token started
  while it awaited aborts before touching the DOM, so a stale render (e.g. an in-flight
  render vs. a locale re-fetch re-render) can't clobber a newer one.
- `[open]` **Bean-model / UI metadata** — `@DataType`, `@NonVisual`, `@Width`,
  `@Sortable`, `@ReorderProperties`, `@Translate`. Unlocks a faithful
  `Grid`/`BeanEditForm`/`BeanDisplay`; pairs with the **BeanModel port** (§6).
- `[open]` **Remaining `@Parameter` options** — `cache`, `principal`, `autoconnect`,
  `name` (largely N/A to Qloom's lazy-binding model). `required`, `allowNull`,
  `defaultPrefix`, and `value` are done.
- `[open]` **`@Import` — `stack` / `module` / `esModule`** — typed but ignored;
  backlog for when a module/ESM/asset-stack story lands. `stylesheet`/`library` are
  done.
- `[open]` **Long tail** — `@Retain`, `@SessionAttribute`, `@Meta`, `@Secure`,
  `@ContentType`, `@Events`, `@UnknownActivationContextCheck`, `@RequestParameter`,
  `@ActivationContextParameter` (per-parameter), `@Path` (asset injection),
  `@ImmutableSessionPersistedObject`, `@DiscardAfter`, `@HeartbeatDeferred`,
  `@Kaptcha` (property decorator; the captcha *components* exist). See the ❌ rows in
  `ANNOTATIONS.md` for per-item notes.
- `[done]` **Mixin system** — fully ported (2026-08-14). Engine (interleaving +
  after-phase reversal + full return-value protocol), both declaration paths
  (`t:mixins` + `@Mixin`), the four injection annotations, and eight mixins. Detail
  in **Recently closed** below; agent guide in `.agents/skills/mixins/SKILL.md`;
  scorecard in `PARITY.md` §Mixin system.

> Everything in `org.apache.tapestry5.ioc`, the REST-publishing annotations, and the
> JPA/`javax.persistence` mapping set are **⛔ N/A by design** (no IoC container, no
> server round-trip, no ORM — PLAN §2–3, §10). They are *not* backlog; see
> `ANNOTATIONS.md` §"Deliberate divergences".

---

## 4. Built-in component library

*Source: `COMPONENT-REFERENCE.md`, `PARITY.md`. The ten parity gaps from the
2026-07-28 hardening pass are all closed (2026-08-01) — see "Recently closed" below.*

- `[open]` **Tag-form informal `id`** — an informal `id` on a *tag-form* `<t:foo>`
  component isn't rendered to the DOM (it works on the element-form
  `<x t:type="foo">`). Surfaced while implementing the parity gaps.
- `[note]` **Submit `defer`** — intentionally **N/A** for Qloom's synchronous submit
  (Tapestry defers a Submit-inside-Loop event notification to end-of-form; there is no
  such ordering concern here).

---

## 5. Reference application

*Source: `PARITY.md`. Every page is ported against unmodified `.tml`; the gate is
green. What remains is polish, not framework parity.*

- `[open]` **`Workspace` / `YourBookings` stubs** — the "booking in progress" side
  panel is registered but not functionally rendered (`Workspace` renders nothing,
  `AjaxLoader` is a placeholder span). Post-v1 polish.
- `[open]` **`Book` date-validation copy** — the ported `Book.ts` date validation is
  wired to its own wording rather than the original catalogue keys; align it to the
  `.properties` keys for byte-for-byte message parity.

---

## 6. BeanModel port — close the `Bean*` fidelity gap

**Status: `[deferred]` to a later delivery.** Design not started; the crux decision
below (metadata source) is explicitly deferred. This section is the groundwork so
delivery starts from a faithful spec, not from scratch. (Recorded 2026-07-29.)

### The gap

Qloom's `Bean*` components (`BeanDisplay`, `BeanEditor`, `BeanEditForm`,
`PropertyDisplay`, `PropertyEditor`) are **named like Tapestry Beans but currently
behave like JSON**: `beanProps.ts` resolves properties from `t:include` else
`Object.keys(obj)`, and every property renders as a plain text input / `String(value)`.
There is **no `BeanModel`, no `PropertyModel`, no per-property `dataType`, no
type→editor selection, no `@DataType`/`@NonVisual`/`@ReorderProperties`** — confirmed
by grep across `packages/*`. The names are correct (Tapestry API surface, required for
`.tml` fidelity — do **not** rename to `Json*`); the *machinery* is what's missing.

### Faithful spec (from the canonical source — [apache/tapestry-5](https://github.com/apache/tapestry-5))

- **`BeanModel` / `PropertyModel`.** A `BeanModel` holds an ordered, case-insensitive
  set of `PropertyModel`s. `PropertyModel` = `{ id (punctuation-stripped name),
  propertyName, propertyType, dataType, label, conduit (get/set accessor), sortable }`.
  Fluent ops: `add`/`addEmpty`/`addExpression`, `exclude(...)` (case-insensitive
  removal), `include(...)` (keep-only + reorder), `reorder(...)` (listed first, rest
  appended). `include`/`exclude`/`reorder`/`add` apply **only to an auto-created
  model**, never an explicitly supplied one.
- **dataType is a chain of command** (`DataTypeAnalyzer`, first non-null wins):
  `@DataType(value)` annotation → default inheritance-aware type map. **Null dataType ⇒
  the property is dropped** (hidden), not rendered as text.
- **Default type → dataType map** (the heart of "more than an object walk"):
  `String→text`, `Number→number` (subclasses too: `Integer→number`), `Enum→enum`,
  `Boolean→boolean`, `Date→date`, `Calendar→calendar`, everything else → null (hidden).
  `password` and `longtext` are **opt-in only** via `@DataType` (both are `String`).
- **dataType → block (component) wiring.** Edit blocks: `text/number→TextField`,
  `enum→Select` (+`EnumSelectModel`), `boolean→Checkbox`, `date/calendar→DateField`,
  `password→PasswordField`, `longtext→TextArea`. Display blocks exist for
  `enum` (localized label), `date/calendar` (formatted `Output`), `password` (one `*`
  per char), `longtext` (`TextOutput`, preserves breaks); **`text/number/boolean` have
  no display block — they fall through to `String(value)`** (which is exactly today's
  behaviour, so display parity for those three is already correct).
- **A `<p:{propertyId}>` block parameter overrides the block for that property**
  (edit or display) — Qloom already does this in `BeanDisplay.beginRender` via
  `BINDINGS[prop]`, so the override slot exists and should be preserved.
- **Ordering (auto model):** base-class props first, then getter **declaration order**,
  then name as tie-break; then `@ReorderProperties`; then component `add/include/…`.
  In a TS port "getter declaration order" ⇒ property declaration order (or an explicit
  order list) since there's no bytecode line info.
- **Editors** push/pull through the conduit and wire a translator + validator per
  property from its annotations (ties into `@qloom/validation` / `@Validate`).

### Crux decision to resolve at delivery time (DEFERRED)

Tapestry sources `dataType` from Java reflection (property return type) + `@DataType`.
Qloom has neither at runtime (TS types are erased; the real beans in the reference app
are **plain objects from the OpenAPI-generated DAL client**, e.g. `t:object="hotel"`).
So the port needs an alternative metadata source. Options weighed, none chosen yet:
1. **Layered chain (leading candidate)** — explicit `t:datatype`/`<p:>` override →
   OpenAPI schema of the DAL type → runtime value inference (`typeof`/`instanceof`) →
   default `text`. Mirrors Tapestry's `DataTypeAnalyzer` chain and fits the plain DAL
   objects the app renders.
2. **OpenAPI-schema-driven only** — needs plumbing to link a live object to its schema;
   hand-built beans fall back to text.
3. **Runtime value inference only** — zero setup, JSON-native, but blind on null/empty
   fields and can't tell `password`/`longtext`/`enum` from plain text.
4. **Explicit metadata only** — a `model`/decorator per property; most boilerplate.

### Scope notes for delivery

- Display side (`BeanDisplay`/`PropertyDisplay`) is the smaller, higher-value slice and
  is the only one the reference app exercises today; editors (`BeanEditor`/
  `BeanEditForm`/`PropertyEditor`) are currently **unused** by any app.
- Keep the `t-beandisplay` CSS class and the `<p:>` override behaviour intact.
- Follow the module architecture rules (one class per file; a `BeanModel`/`PropertyModel`
  pair, a `dataType` analyzer, and a `dataType→component` block registry as separate
  units). Add per-component coverage to `COMPONENT-REFERENCE.md` and tests to
  `@qloom/component-tests` when built.

---

## 7. Test-parity skips

*Source: `TEST-PARITY.md`. Ported test cases committed as `test.skip`, grouped by
theme; the per-case ledger stays in that doc.*

- `[done ✓]` **Loop-in-form round-trip** — a `<t:loop>` (or `AjaxFormLoop`) of fields
  inside a `<t:form>` now round-trips every row's edit on submit. Each field captures a
  row-restore closure at render time and re-establishes its loop `value` before writing,
  so edits land on the right item (Qloom replays over the live in-memory source — no
  ValueEncoder/`formdata`). Covered by `LoopForm.spec.ts`. *Note:* a primitive source
  doesn't round-trip (the loop value is an output, as in Tapestry) — use an object
  collection; and rows **added** to an `AjaxFormLoop` after the initial render aren't in
  the form's field set yet (open).
- `[open]` **Zone-inside-form round-trip** — cascading / update-a-zone-inside-a-form
  cases still need the Form-family wiring those specs assume.
- `[open]` **`MultiZoneUpdate` / `AjaxResponseRenderer` server API** — multi-zone
  updates (incl. in-loop) and no-client-id zone updates. These lean on a server-side
  Ajax response API Qloom doesn't model.
- `[open]` **`Delegate` dedicated demo** — deferred to a Delegate follow-on; and the
  **`Kaptcha` verify** case needs a `captchaProvider` wired in the test app.
- `[blocked]` **Mixin cases** — e.g. afterRender not shortcutting sibling *mixin*
  phases. Blocked on the mixin system (§3).
- `[note]` **Non-goals / out of scope** — SSR zone redirect, `zone:updated` client
  event, JS namespace/asset-CSS concerns. Recorded, not planned.

---

## 8. Release

*The gating decisions to settle before the first npm publish.*

- `[open]` **Confirm the copyright holder** in `LICENSE` (currently "John Coleman").
- `[done]` **Repository URL** — every published `package.json` points at the real home
  `github.com/JohnSColeman/qloom`. Also fixed the scaffolder template README link
  (`create-qloom/template/README.md`, was a stale `Qloom-framework/Qloom`) and a
  corrupted root `bugs` URL (`uilt-framework`, a rebrand typo; root is private/unpublished).
- `[open]` **Confirm the `@qloom` npm org/scope** exists with publish rights, and that
  the unscoped `create-qloom` name is available/owned.
- `[done]` **Publish compiled JS, not TS source** — the source-published libs
  (`main → src/index.ts`) broke *consumer* apps: a scaffolded app pulls `@qloom/*`
  from `node_modules`, where Vite's dep optimizer (oxc, Vite 8) pre-bundles them
  **without** `experimentalDecorators`, leaving legacy decorators raw → `SyntaxError`
  → blank page. (In-repo works only because workspace packages bypass that path.)
  Fix: each source lib now carries a `publishConfig` overriding `main`/`types`/
  `exports` → `dist` (applied by `pnpm publish`/`pnpm pack` only, so in-repo keeps
  source-resolution DX) and ships `dist` in `files`; `tsc -b` already emits valid
  JS (`__decorate` calls) with the right flags. **Verified** by packing all nine
  packages and running a scaffolded app against the tarballs — it renders and the
  counter increments. Bumped everything to `0.1.0-beta.1`.
- `[open]` **Publish the beta** (`0.1.0-beta.1`, `--tag beta`) once the above are
  settled and the full green gate passes. (beta.1 is a *new* version, so no npm
  24h-unpublish wait — just publish all `@qloom/*` + `create-qloom` fresh.)

---

## Recently closed

### Component-parity gaps — all ten closed (2026-08-01)

Surfaced by the 2026-07-28 component-test hardening pass; each is covered by a
`@qloom/component-tests` suite. Kept here as a record; per-component detail is in
`COMPONENT-REFERENCE.md`.

| # | Component / area | What landed |
|---|---|---|
| 1 | **FormFragment** | Fields inside a *hidden* fragment are excluded from submit-time validation (live-DOM `offsetParent` check; revealing re-includes them). `FormFragment.spec.ts`. |
| 2 | **Submit** | `mode` (normal/cancel/unconditional) → `data-submit-mode`; `Form` reads it off the clicked submitter and skips validation for cancel/unconditional. `defer` is N/A by design. `Submit.spec.ts`. |
| 3 | **Palette** | Move-right/left (+ up/down in `reorder`) controls and double-click; `type="button"` so they never submit; two-way `selected` carries order. `Palette.spec.ts`. |
| 4 | **Alerts** | `div.alert.alert-<severity>` with `.alert-message` (raw when `markup`) + `.alert-dismiss`; bound `source` or the shared `AlertStorage` static (re-renders in place). `Alerts.spec.ts`. |
| 5 | **Kaptcha** | The `KaptchaImage` is a click-to-refresh control (fetches a fresh challenge, re-records its id). `Kaptcha.spec.ts`. |
| 6 | **AjaxFormLoop** | Each row stamped with a stable `data-key` so the reconciler matches by identity; `RemoveRowLink` resolves its index from the live DOM at click time (`removeRowByNode`). `AjaxFormLoop.spec.ts`. |
| 7 | **Form / LinkSubmit** | Re-entrancy guard blocks a rapid second submit; flag reset on a macrotask so a queued double-submit is caught but a deliberate resubmit still works. `DoubleSubmit.spec.ts`. |
| 8 | **Select** | `blankOption` (ALWAYS/NEVER/AUTO) + `blankLabel`. **Divergence:** AUTO omits the blank (no bean-validation required-ness signal); authors opt in with `blankOption="always"`. `Select.spec.ts`. |
| 9 | **Loop** | `element` (wraps each iteration) and `empty` (`<p:empty>` block when source null/empty). `Loop.spec.ts`. |
| 10 | **Router** | `pathFor` percent-**encodes** / `resolve` percent-**decodes** each activation-context segment, so spaces/slashes/`%`/non-ASCII survive a deep-link + passivation round-trip. `PageActivationContext.spec.ts`. |

### Mixin system — fully ported (2026-08-14)

Faithful to `tapestry-core`'s `corelib/mixins` + the mixin-transform workers; agent
guide in `.agents/skills/mixins/SKILL.md`, scorecard in `PARITY.md` §Mixin system.

- **Engine** (`core/driveInstance`): render-phase interleaving (before-mixins → host →
  after-mixins), after-phase order reversal, and the full return-value protocol — the
  first participant to return a **boolean** aborts the rest (so a mixin's `true` overrides
  a host's `false`; void/null continues; default `true`). `ReturnProtocol.spec.ts`.
- **Declaration:** `t:mixins="a, b"` (per-usage) + `@Mixin(name, { order })` (class-level
  implementation mixin — collected up the prototype chain, `before:`/`after:` ordering,
  fail-loud duplicate rejection; merge/order in `core/resolveMixins`). `ClassMixin.spec.ts`.
- **Injection:** `@InjectContainer` (host), `@BindParameter(...names)` (host param, two-way),
  `@Environmental(token)` + the `Environment` static stack (`core`), `@MixinAfter`.
  `Mixins.spec.ts` / `Environmental.spec.ts`.
- **Mixins:** `Confirm`, `DiscardBody`, `RenderDisabled` (auto-applied to the `Field` base
  via `@Mixin`, matching `AbstractField`), `ZoneRefresh`, `TriggerFragment`, `Autocomplete`
  (+ `EchoValue` demo). Marquee mixins run natively — no server round-trip / `JavaScriptSupport`.
  Specs: `ZoneRefresh` / `TriggerFragment` / `Autocomplete`.
- **Divergences:** `@Mixin` is a class decorator taking the registry name (TS erases the
  field type Tapestry keys on); Tapestry's `@Mixins`/`@MixinClasses` are redundant with
  `t:mixins` and not ported. *Deferred (Autocomplete):* `{label,value}` options, `context`,
  full ARIA combobox.

### Annotations & parameters — landed since the M1 surface

- `@Parameter` `required` (throws at render), `allowNull` (fail-loud on a bound null),
  `defaultPrefix` (runtime-resolved for custom components), `value` (declared default
  binding expression).
- `@InjectComponent`, `@InjectPage`, `@PageActivationContext` typed handles.
- All eight render phases present (`@BeforeRenderTemplate`/`@AfterRenderTemplate` were
  the last two).
- `ApiError.body` / `messageOf` (structured error body on the data client).
