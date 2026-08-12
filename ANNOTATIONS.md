# Qloom — Tapestry annotation coverage & backlog

A **complete inventory of every author-facing annotation Apache Tapestry 5 processes** — the annotations a developer places on their own page, component, mixin, entity/bean, or IoC-module classes and their methods/fields/parameters — cross-referenced against what **Qloom** implements today. This is both a parity scorecard and the implementation backlog.

Sourced by scanning the canonical Tapestry 5 tree (`tapestry-core`, `tapestry5-annotations`, `tapestry-hibernate*`, `tapestry-jpa`, `tapestry-kaptcha`, `beanmodel`) and the `tapestry5-hotel-booking` reference app, then diffed against Qloom's decorator surface (`packages/runtime/src`), engine (`packages/core/src`), components (`packages/components/src`), and validation subsystem (`packages/validation/src`). See also [PARITY.md](PARITY.md) (reference-app scorecard) and [COMPONENT-REFERENCE.md](COMPONENT-REFERENCE.md) (component coverage).

## Status legend

| Mark | Meaning |
|:---:|---|
| ✅ | **Done** — implemented with working parity for the semantics the reference app exercises. |
| 🟡 | **Partial** — core behaviour works; documented options or edge cases are missing (backlog). |
| ❌ | **Not done** — no Qloom equivalent yet; genuine backlog item. |
| ⛔ | **N/A by design** — deliberately deleted per Qloom's architecture invariants (PLAN §2–3, §10): no server-side IoC container, no server round-trip, no server transactions, no server-published REST. Not a gap — a divergence. Listed for completeness so the backlog stays honest. |

> **Used-by-hotel-booking** column marks annotations the Tapestry reference app actually uses (`●`), to prioritise the backlog toward proven-necessary features.

## Score at a glance

- **✅ Done:** 17 · **🟡 Partial:** 5 · **❌ Not done (backlog):** ~34 · **⛔ N/A by design:** ~39
- Every annotation the hotel-booking port needs to render is ✅ or 🟡; the ❌ backlog is dominated by (a) IoC-adjacent features Qloom intentionally lacks, (b) bean-model/UI-metadata annotations (`@DataType`, `@NonVisual`, `@Width`, …), and (c) entity bean-validation (`@NotNull`, `@Size`, …), which today is only reachable through the string-based `@Validate`.

---

## 1. Class-level annotations (`@Target` includes TYPE)

### 1.1 Component / page behaviour — `org.apache.tapestry5.annotations`

| Annotation | Key attributes | Qloom equivalent | Status | Used | Notes / backlog |
|---|---|---|:---:|:---:|---|
| `@Import` | `stylesheet[]`, `library[]`, `stack[]`, `module[]`, `esModule[]` | `@Import` (`runtime/src/Import.ts`) | 🟡 | ● | `stylesheet` + `library` merge into `IMPORTS` and inject once into `<head>`. `stack`/`module`/`esModule` are typed but **ignored** — backlog when a module/ESM story lands. |
| `@SupportsInformalParameters` | — | compiler `INFORMALS` handling | 🟡 | | Informal (pass-through) attributes are collected and rendered by the compiler, but there is no explicit class marker gating them per-component. |
| `@Meta` | `String[] value` | — | ❌ | | Arbitrary page/component meta-data (e.g. drives `@Secure`, `@ContentType`). No metadata bag. |
| `@Secure` | — | — | ❌ | | "HTTPS only." Client-side analogue would be a redirect guard; low priority. |
| `@ContentType` | `String value` | — | ❌ | | Page response content type. Mostly moot for a browser-only renderer. |
| `@Events` | `String[] value` | — | ❌ | | Documentation-only (declares events a component may fire). Cheap to honour as a no-op/registry. |
| `@UnknownActivationContextCheck` | `boolean value` | — | ❌ | | Controls 404 on surplus activation context. Belongs with router hardening. |
| `@MixinAfter` | — | `@MixinAfter` (`runtime/src/MixinAfter.ts`) | ✅ | | Marks a mixin whose render phases run after the host's (before-mixins → component → after-mixins). Landed with the mixin engine (Phase 1). |
| `@RestInfo` | `consumes[]`, `produces[]`, `returnType` | — | ⛔ | | REST endpoint metadata. Qloom **consumes** an OpenAPI contract; it does not publish REST endpoints (PLAN §10). |
| `@WhitelistAccessOnly` | — | — | ⛔ | | Server request-whitelist security. |

### 1.2 Bean model — `org.apache.tapestry5.beaneditor`

| Annotation | Key attributes | Qloom equivalent | Status | Used | Notes / backlog |
|---|---|---|:---:|:---:|---|
| `@ReorderProperties` | `String value` | — | ❌ | | Reorders/removes BeanModel properties. Backlog with `Grid`/`BeanDisplay` metadata (pairs with §3.4). |

### 1.3 Session persistence — `org.apache.tapestry5.http.annotations`

| Annotation | Key attributes | Qloom equivalent | Status | Used | Notes / backlog |
|---|---|---|:---:|:---:|---|
| `@ImmutableSessionPersistedObject` | — | — | ❌ | | Skips dirty-tracking for an immutable SSO. `SessionStore` could honour it as an optimisation hint. |

### 1.4 IoC service / module classes — `org.apache.tapestry5.ioc.annotations` (all ⛔)

| Annotation | Purpose |
|---|---|
| `@Marker`, `@EagerLoad`, `@Scope`, `@ServiceId`, `@PreventServiceDecoration`, `@Description`, `@ImportModule`, `@SubModule` (●), `@UsesConfiguration`, `@UsesOrderedConfiguration`, `@UsesMappedConfiguration` | Server-side IoC container wiring. Qloom has **no IoC container** by design — app wiring is explicit `Registry.registerComponent` / `Data.configureData` calls in `main.ts`. All ⛔. |

---

## 2. Method-level annotations (`@Target` includes METHOD)

### 2.1 Render-phase — `org.apache.tapestry5.annotations`

| Annotation | Qloom equivalent | Status | Used | Notes / backlog |
|---|---|:---:|:---:|---|
| `@SetupRender` | `@SetupRender` (`runtime/src/SetupRender.ts`) | ✅ | ● | Return-value protocol honoured by `driveInstance`. |
| `@BeginRender` | `@BeginRender` | ✅ | ● | |
| `@BeforeRenderBody` | `@BeforeRenderBody` | ✅ | | |
| `@AfterRenderBody` | `@AfterRenderBody` | ✅ | | |
| `@AfterRender` | `@AfterRender` | ✅ | ● | `false` re-loops from `beginRender` — how `Loop` iterates. |
| `@CleanupRender` | `@CleanupRender` | ✅ | | |
| `@BeforeRenderTemplate` | `@BeforeRenderTemplate` (`runtime/src/BeforeRenderTemplate.ts`) | ✅ | | Wraps template rendering; `false` suppresses the template (and its body). The body phases nest inside, firing at `<t:body/>`. |
| `@AfterRenderTemplate` | `@AfterRenderTemplate` (`runtime/src/AfterRenderTemplate.ts`) | ✅ | | Fires after the template renders (even when `beforeRenderTemplate` suppressed it). All eight Tapestry render phases are now present. |

### 2.2 Page lifecycle — `org.apache.tapestry5.annotations`

| Annotation | Qloom equivalent | Status | Used | Notes / backlog |
|---|---|:---:|:---:|---|
| `@PageLoaded` | `@PageLoaded` (`runtime/src/PageLoaded.js`) or method `pageLoaded` | ✅ | | Fires once per navigation, before `onActivate`. Qloom re-instantiates the page per nav (no pool), so `@PageLoaded` and `@PageAttached` coincide. Router-driven via `invokeLifecycle`. |
| `@PageAttached` | `@PageAttached` / method `pageAttached` | ✅ | | Fires per navigation, before `onActivate` (coincides with `@PageLoaded`). |
| `@PageDetached` | `@PageDetached` / method `pageDetached` | ✅ | | Fires on the **outgoing** page when navigating away — the teardown hook (clear timers/listeners). The Router holds `this.current` to call it. |
| `@PageReset` | `@PageReset` / method `pageReset` | ✅ | | Fires **after** `onActivate`, before render. **Not** a reconstructability mechanism (per-nav re-instantiation already resets transient state); it is the hook to reset *persistent* `@Persist`/`@SessionState` on a fresh visit. |

### 2.3 Method behaviour — `org.apache.tapestry5.annotations`

| Annotation | Key attributes | Qloom equivalent | Status | Used | Notes / backlog |
|---|---|---|:---:|:---:|---|
| `@OnEvent` | `value` (event), `component` | `@OnEvent` (`runtime/src/OnEvent.ts`) | ✅ | ● | Component-targeted; dispatched by container-chain bubbling in `triggerEvent`. Also supports the `on<Event>From<Id>` naming convention. |
| `@Log` | — | — | ❌ | ● | Method entry/exit/exception logging. Trivial decorator; used by hotel-booking. |
| `@Cached` | `watch` | — | ❌ | | Memoises a getter for the render. Common in real pages; good backlog candidate. |
| `@HeartbeatDeferred` | — | — | ❌ | | Defers execution to end of the current Heartbeat (client render ordering). |
| `@DiscardAfter` | — | — | ❌ | | Discards persistent field changes after the method — pairs with `@Persist`. |
| `@PublishEvent` | — | — | ⛔ | | Exposes a component event as a REST endpoint (server). |
| `@RestInfo` | (see §1.1) | — | ⛔ | | REST/OpenAPI publish metadata. |

### 2.4 IoC module methods & transactions (all ⛔)

| Annotation | Purpose |
|---|---|
| `@Contribute` (●), `@Startup` (●), `@Advise`, `@Decorate`, `@Match` (●), `@Order`, `@Optional`, `@NotLazy`, `@Operation`, `@PostInjection`, `@ApplicationDefaults` (●), `@FactoryDefaults` | IoC module builder/decorator/contribution wiring. No IoC container → all ⛔. In the hotel-booking **port**, the Tapestry `ValidatorMacro` contribution becomes explicit `Validators.registerMacro(...)` calls. |
| `@CommitAfter` (hibernate / jpa) (●) | Commits a server DB transaction after the method. Qloom's data layer is an OpenAPI-generated fetch client (PLAN §10), not a server DAO → ⛔. |

---

## 3. Field-level annotations (`@Target` includes FIELD)

### 3.1 Binding & state — `org.apache.tapestry5.annotations`

| Annotation | Key attributes | Qloom equivalent | Status | Used | Notes / backlog |
|---|---|---|:---:|:---:|---|
| `@Property` | `read`, `write` | `@Property` (`runtime/src/Property.ts`) | ✅ | ● | Registers a bindable field. Qloom's is a bare marker; Tapestry's `read`/`write` access flags are **not** supported (minor gap — rarely used). |
| `@Parameter` | `required`, `allowNull`, `cache`, `value`, `defaultPrefix`, `principal`, `autoconnect`, `name` | `@Parameter` (`runtime/src/Parameter.ts`) | 🟡 | ● | Two-way binding + field-initializer-as-default works. **`required` is enforced** — an unbound required parameter throws at render (`renderComponent`), naming the component + parameter. **`allowNull` is enforced** — a *bound* `allowNull:false` parameter that resolves to null/undefined throws on read (the getter, fail-loud), naming component + parameter; an unbound param is null-tolerant storage. **`defaultPrefix` is enforced** for custom components — `@Parameter({ defaultPrefix: "literal" })` makes a bare template value the raw string; the compiler emits a `resolveDefaultPrefix(...)` for an ambiguous bare single identifier and the runtime reads the child's declared prefix (default `prop`). Built-ins keep the compiler's `LITERAL_PARAMS` fast path. **`value` is implemented** — an unbound parameter with no field initializer falls back to its declared default *binding expression* (`literal:`/`message:`/`prop:`, or bare per `defaultPrefix`), evaluated at read time against the container. `cache`, `principal`, `autoconnect`, `name` are still unimplemented (largely N/A to Qloom's lazy-binding model). |
| `@Persist` | `String value` (strategy) | `@Persist(scope, opts)` (`runtime/src/Persist.ts`) | ✅ | ● | Scopes `session`/`local`/`flash` (Qloom swaps Tapestry's `client` for `local`). Encrypted via `SessionStore`. Richer than stock Tapestry on scopes. |
| `@SessionState` | `create` | `@SessionState(ctor, opts)` (`runtime/src/SessionState.ts`) | ✅ | ● | Class-based SSO, auto-create, `<name>Exists` companion when `create=false`, shared by class name. Good parity. |
| `@Retain` | — | — | ❌ | | Field not cleared between requests. Backlog with the lifecycle/reset story. |
| `@SessionAttribute` | `String value` | — | ❌ | | Maps a field to a raw `HttpSession` attribute (distinct from an SSO). |
| `@PageActivationContext` | — | `@PageActivationContext()` (`runtime/src/PageActivationContext.ts`) | ✅ | ● | Two-way binds page fields to URL context slots (declaration order); the router populates them before `onActivate` and re-synthesises the URL on render when no `onPassivate` exists. Primitive coercion (string/number/boolean); entity-by-id still fetches in `onActivate` (no ValueEncoder). Adopted in the `View` port. |

### 3.2 Embedded components & injection — `org.apache.tapestry5.annotations`

| Annotation | Key attributes | Qloom equivalent | Status | Used | Notes / backlog |
|---|---|---|:---:|:---:|---|
| `@Component` | `id`, `type`, `parameters[]`, `inheritInformalParameters`, `publishParameters` | declared in `.tml`; `@InjectComponent` for the handle | 🟡 | ● | Embedded components are declared in the **unchanged template** and compiled to `renderComponent(...)` calls — Qloom's core invariant. The **typed field handle** Tapestry's `@Component Form loginForm` gives is now provided by `@InjectComponent` (resolves the child by `t:id`). |
| `@InjectComponent` | `value`, `optional` | `@InjectComponent(id?)` (`runtime/src/InjectComponent.ts`) | ✅ | ● | Read-only field resolving the host's embedded child by `t:id` (default = field name). `renderComponent` registers each id'd child on its container (`CHILDREN`); available in event handlers, as in Tapestry. |
| `@InjectContainer` | — | `@InjectContainer` (`runtime/src/InjectContainer.ts`) | ✅ | | Read-only field resolving the containing component. For a **mixin** it is the host the mixin is attached to (the mixin's `CONTAINER` is bound to the host by `renderComponent`) — the canonical way a mixin reads host state. Landed with mixin Phase 2 (`RenderDisabled`). |
| `@InjectPage` | `value` | `@InjectPage(PageClass)` (`runtime/src/InjectPage.ts`) | ✅ | ● | Lazily yields the target page instance (WeakMap-cached per host); returning it from an event handler navigates there (`Navigation.navigate` routes by constructor). Takes the page class (typed); for context, `Navigation.navigate(page, [ctx])`. |
| `@Mixin` | `value`, `order` | `@Mixin(name, { order })` (`runtime/src/Mixin.ts`) | ✅ | | Implementation mixin: a class decorator so a component **always** carries the named mixin (no `t:mixins` needed), collected up the prototype chain. `order` gives `before:`/`after:` constraints (incl. `*`); attaching a mixin twice (class + `t:mixins`) is a fail-loud error. Resolution + ordering live in `core/resolveMixins`. Qloom divergence: a **class** decorator taking the registry name (TS erases the field type Tapestry keys on) — no instance injection back into the host. |
| `@Mixins` / `@MixinClasses` | `value`, `order` | template `t:mixins` | ⛔ | | Attach mixins to a Java-declared `@Component` field. Qloom declares embedded components in the **template**, where `t:mixins="…"` already covers this — so these are redundant here and not planned. |
| `t:mixins` (template) | — | compiled + interleaved | ✅ | ● | `t:mixins="a, b"` attaches registry mixins to one component usage; their render phases interleave with the host (before-mixins → component → after-mixins, split by `@MixinAfter`). Merged with any `@Mixin` implementation mixins. |
| `@BindParameter` | `name`, `value` | `@BindParameter(...names)` (`runtime/src/BindParameter.ts`) | ✅ | | A mixin field two-way-bound to a host parameter: `user-variable <=> mixin.field <=> host.param`. Resolves through the host bindings the mixin shares; first named candidate the host declares wins (defaults to the field name). Landed with mixin Phase 3 (`EchoValue`). |
| `@Environmental` | `boolean value` | `@Environmental(token, { required? })` (`runtime/src/Environmental.ts`) + `Environment` (`core/src/Environment.ts`) | ✅ | | Injects an ambient value an ancestor pushed onto the render-scoped `Environment` stack, read afresh per access. `token` is the stack key (a class constructor standing in for its type, a string, or a symbol — TS types erase). Required by default (missing → throws, listing what is available); `{ required: false }` mirrors Tapestry's `@Environmental(false)`. Usable on components, pages, and mixins — the primary way a mixin reaches a service published by an ancestor it holds no reference to. |
| `@Id` | `String value` | `t:id` in template | ⛔ | | Component id assignment; handled via the template. |

### 3.3 IoC field injection — `org.apache.tapestry5.ioc.annotations` (all ⛔)

| Annotation | Purpose |
|---|---|
| `@Inject` (●), `@Value`, `@Symbol`, `@InjectService`, `@InjectResource`, `@IntermediateType`, `@Autobuild`, `@Local`, `@Primary`, `@ComponentLayer`, `@ComponentClasses` | Server IoC dependency injection. In the hotel-booking **port**, `@Inject`-ed services (DAO, security) are replaced by the generated OpenAPI client + direct imports. All ⛔. |
| `@Path`, `@Service` (`tapestry-core`) | Asset-by-path / service-by-id injection. `@Path` (asset injection) could become a small backlog item if asset handles are needed; `@Service` is ⛔ (IoC). |

### 3.4 Bean-model & UI metadata — `org.apache.tapestry5.beaneditor` / `kaptcha`

| Annotation | Key attributes | Qloom equivalent | Status | Used | Notes / backlog |
|---|---|---|:---:|:---:|---|
| `@Validate` | `String value` (spec) | `@Validate(spec)` (`runtime/src/Validate.ts`) | 🟡 | ● | Spec string honoured; discovered per-property by `Field` via the `t:id` convention; composed by `packages/validation`. **Built-in validators are M1-scoped:** `required`, `minlength`, `maxlength`, `email` only. Missing Tapestry's `regexp`, `min`, `max`, `checked`, `unchecked`, `none`, numeric length bounds. Extending the `Validators` registry is the primary validation backlog. |
| `@DataType` | `String value` | — | ❌ | | Overrides a property's editor/display type in `BeanEditForm`/`BeanDisplay`. Backlog with bean-model metadata. |
| `@NonVisual` | — | — | ❌ | | Excludes a property from generated UI. |
| `@Width` | `int value` | — | ❌ | | Display/edit width. |
| `@Translate` | `String value` | — | ❌ | | Assigns a translator (parse/format) to a property. |
| `@Sortable` | `boolean value` | — | ❌ | | Marks a `Grid` column (non-)sortable. Backlog with `Grid` sorting. |
| `@Kaptcha` | — | `Kaptcha*` components | 🟡 | | The captcha **components** exist (`Captcha.ts`, `KaptchaField.ts`, `KaptchaImage.ts`), but there is no `@Kaptcha` property decorator. |

---

## 4. Parameter-level annotations (`@Target` includes PARAMETER)

Applied to event-handler / REST method parameters and IoC constructor parameters.

| Annotation | Key attributes | Qloom equivalent | Status | Used | Notes / backlog |
|---|---|---|:---:|:---:|---|
| `@RequestParameter` | `value`, `allowBlank` | — | ❌ | | Maps a query-string param to a handler parameter. Reasonable backlog for event handlers. |
| `@ActivationContextParameter` | `String value` | `onActivate(context)` args | 🟡 | | Activation context reaches handlers via `onActivate` array today, not per-parameter binding. |
| `@RequestBody` | `allowEmpty` | — | ⛔ | | REST request-body binding (server). |
| `@StaticActivationContextValue` | `String value` | — | ⛔ | | OpenAPI/REST handler metadata. |
| `@Inject` / `@Value` / `@Symbol` / `@InjectService` / `@Autobuild` / `@Local` / `@Primary` (params) | — | — | ⛔ | | IoC constructor/method-parameter injection. |

---

## 5. Entity / persistence / bean-validation annotations

The hotel-booking entities (`Hotel`, `Booking`, `User`) carry JPA + bean-validation annotations. Qloom's **one deliberate divergence** from Tapestry is data access: entities are **not** hand-written annotated classes but **generated** from an OpenAPI contract into plain typed interfaces (`packages/compiler/src/generateApiClient.ts`, PLAN §10). So the JPA mapping annotations are all ⛔ — there is no ORM to configure. The **bean-validation** annotations are a real gap: today the only path to validation is the string-based `@Validate` on component properties (see [Qloom-beanvalidator-gap](.claude/…) note — form-level `t:validate="object"` is unported).

### 5.1 JPA mapping — `javax.persistence` (all ⛔ — replaced by OpenAPI client)

| Annotation | Used | Purpose |
|---|:---:|---|
| `@Entity`, `@Table`, `@Id`, `@GeneratedValue`, `@Column`, `@Transient`, `@ManyToOne`, `@Temporal`, `@Enumerated`, `@NamedQueries`, `@NamedQuery` | ● | ORM mapping. Qloom has no ORM; entity shapes and queries come from the backend API + generated client. |
| `@NaturalId` (hibernate) | ● | Hibernate natural-key mapping. |

### 5.2 Bean validation — `javax.validation.constraints` / hibernate-validator

| Annotation | Key attributes | Qloom equivalent | Status | Used | Notes / backlog |
|---|---|---|:---:|:---:|---|
| `@NotNull` | `message` | `@Validate("required")` | ❌ | ● | Entity-level constraint. No annotation-on-entity validation; would map to a `required` rule if entity validation is ported. |
| `@Size` | `min`, `max`, `message` | `@Validate("minlength=…,maxlength=…")` | ❌ | ● | Maps conceptually to `minlength`/`maxlength` (already unified on those names per the `@Validate` grammar), but not wired from entity annotations. |
| `@Min` / `@Max` | `value`, `message` | — (needs `min`/`max` validators) | ❌ | ● | Requires adding numeric `min`/`max` validators to the registry (§3.4 backlog). |
| `@Pattern` | `regexp`, `message` | — (needs `regexp` validator) | ❌ | ● | Requires the `regexp` validator. |
| `@Email` (hibernate-validator) | — | `@Validate("email")` | 🟡 | ● | The `email` validator exists; the entity-annotation entry point does not. |

> **Backlog theme — entity validation:** porting §5.2 means (a) extending `Validators` with `regexp`/`min`/`max` (also needed by §3.4), and (b) a mechanism to read constraints declared on generated/entity types and feed them into the same `Composite` pipeline the component `@Validate` already uses. This is the natural M2 of the validation subsystem.

---

## Deliberate divergences (why so many ⛔)

These are **not** backlog — they follow directly from PLAN §2–3 and §10:

1. **No IoC container.** Tapestry's entire `org.apache.tapestry5.ioc` annotation family (`@Inject`, `@Contribute`, `@Advise`, `@Scope`, service markers…) is deleted. Qloom wires apps with explicit `Registry`/`Data`/`Messages`/`Captcha` configuration calls in `main.ts`.
2. **No server round-trip.** REST-publishing annotations (`@PublishEvent`, `@RestInfo`, `@RequestBody`) are gone; Qloom is browser-only and *consumes* an OpenAPI contract rather than publishing one.
3. **No server transactions / ORM.** `@CommitAfter` and the JPA/`javax.persistence` mapping set are replaced wholesale by the generated OpenAPI client (the single deliberate data-access divergence, PLAN §10).
4. **Server-statelessness plumbing deleted.** Because the page instance is alive in memory, `t:formdata`/EventLink-context machinery is unnecessary; only genuine navigational state (`onActivate`/`onPassivate`) is kept — which is why `@PageActivationContext` is ⛔/replaced rather than ported verbatim.

## Backlog

This doc is the coverage *scorecard*; the actionable, prioritised backlog lives in
**[BACKLOG.md](BACKLOG.md)** — the annotation items in §3 (ranked by hotel-booking
usage: `@Log`, `@Cached`, page lifecycle, bean-model metadata, remaining `@Parameter`
options, `@Import` `stack`/`module`, the long tail, and the blocked mixin system),
with validation-adjacent annotations in §2 and the BeanModel port in §6.

Already landed since the M1 surface: `@Parameter` `required`/`allowNull`/`defaultPrefix`/
`value`; `@InjectComponent` / `@InjectPage` / `@PageActivationContext` typed handles;
all eight render phases (`@BeforeRenderTemplate`/`@AfterRenderTemplate` last).
