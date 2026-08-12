# Qloom — reference application & feature-parity scorecard

To prove Qloom is a *faithful* Tapestry port (PLAN §2), we pin it against real,
published Tapestry applications and port them page-for-page, template-unchanged.

**Status: reference parity complete.** Every page of the hotel-booking app is
ported and renders against its **unmodified `.tml`**; the automated gate is
**40 checks green** plus an end-to-end user-journey test.

**Companion scorecards:** [COMPONENT-REFERENCE.md](COMPONENT-REFERENCE.md) tracks
per-component coverage; [ANNOTATIONS.md](ANNOTATIONS.md) is the complete
class/method/field annotation inventory and implementation backlog.

## Reference applications

### Primary target — `tapestry5-hotel-booking`
- **Repo:** https://github.com/ccordenier/tapestry5-hotel-booking (⭐61)
- **Licence:** Apache 2.0 (`Copyright 2009 … Licensed under the Apache License, Version 2.0`) — templates may be reused verbatim with attribution.
- **Why:** a *complete* Seam-style application (the "Hotel Booking" demo recognisable across Seam / Spring Web Flow), not a toy. 7 pages, 6 components, 4 entities, a CRUD DAO layer, auth, Ajax search. It exercises exactly the features that most need a real-world witness. Its data layer (a Hibernate `CrudServiceDAO`) is the one seam Qloom deliberately re-imagines as an OpenAPI-generated client (PLAN §10) rather than porting.

### Secondary / graded on-ramp — `hlship/tapestry5-tutorial`
- **Repo:** https://github.com/hlship/tapestry5-tutorial (⭐23) — the **official** tutorial, authored by Tapestry's creator Howard Lewis Ship.
- **Licence:** ⚠️ no explicit LICENSE file in the repo. Treat as *read-for-behaviour, reimplement* rather than copy templates verbatim.

## Pages ported (unmodified `.tml`)

| Page | Exercises | Status |
|---|---|---|
| `Index` | activation redirect → `Signin` when logged out | ✅ |
| `Signin` | login form → generated `authenticate`; bad-credential error via `<t:errors/>` | ✅ |
| `View` | activation-context id → `getHotel` → `BeanDisplay` + `HotelClass` (`<p:stars>`) | ✅ |
| `Search` | `Grid` (+ Ajax `Zone` filter), `Select`, `@SessionState` criteria, post-login redirect | ✅ |
| `Settings` | *implicit* `<form>` component, password-match error | ✅ |
| `Book` | `<t:delegate>`/`<t:block>` multi-step wizard, `DateField`, `RadioGroup`, `SelectModel`s, `<t:label for>` | ✅ |
| `Signup` | tapestry-kaptcha (`<t:kaptchaimage>`/`<t:kaptchafield>`) → API-verified captcha | ✅ |

## What the hotel-booking app exercises → Qloom mapping

| Tapestry feature | Where | Qloom mechanism | Status |
|---|---|---|---|
| `Layout` + `t:type="layout"`, `<t:body>`, `Delegate`, `security.authenticated` | `components/`, all pages | component registry, `@Parameter`, literal-default params | ✅ |
| `${…}` expansions, binding prefixes, `t:type`/`t:id`, implicit components | all `.tml` | `.tml` compiler (htmlparser2, XML) → render program | ✅ |
| Property-expression language (chains + `?.`, method calls, literals, lists/maps, `a..b` ranges, `!`) | `${…}` + `t:param` | full PEL: tokenizer → recursive-descent parser → value/conduit emitters (`@qloom/compiler`) + `pelRange` (`@qloom/core`) | ✅ (at grammar parity; no arithmetic/comparison, as Tapestry) |
| `@Property` page/component state | every page | `@Property` | ✅ |
| Render phases / `@OnEvent(SUCCESS)` + `on<Event>From<Id>` | all pages | component-tree events + convention/`@OnEvent` | ✅ |
| `HotelClass` (stars) + `BeanDisplay` (property list, `<p:prop>` overrides) | `View`, `Book` | Qloom built-ins | ✅ |
| `Grid` tabular display (`include`/`add`, `p:<col>Cell`, `p:empty`, pagination) | `Search` | Qloom `Grid` | ✅ |
| `@InjectComponent Zone result` — Ajax search | `Search` | `Zone` re-render through the focus-preserving reconciler | ✅ |
| Activation context / redirect / URL state | `Index`→`Signin`, `View`, `Book` | `onActivate`/`onPassivate` ↔ URL, `PageLink`, `navigate` | ✅ |
| Forms + validation (required/minlength/email, cross-field) | `Signin`/`Signup`/`Book`/`Settings` | `Form` (two-way binding, `Errors`, PRG) | ✅ |
| `TextField`/`PasswordField`/`DateField`/`Select`/`RadioGroup`+`Radio`/`Label` | forms | Qloom field components | ✅ |
| `SelectModel` (`BedType`/`Months`/`Years`) + enum-derived model | `Book` | `SelectModel`/`OptionModel` base + `EnumSelectModel` | ✅ |
| `<t:block>` + `<t:delegate to="step">` multi-step wizard | `Book` | named blocks hoisted to instance fields; `Delegate` renders them | ✅ |
| `@SessionState` (`SearchCriteria`, `UserWorkspace`) | `Search`, `Book`, `View` | `@SessionState(Class)` — type-keyed, encrypted store; `persist:false` for card data | ✅ |
| `@Persist` (`session`/`local`/`flash`) | framework | encrypted, in-memory-cached store (see `examples/router`) | ✅ |
| `CrudServiceDAO` + Hibernate named queries | `dal/` | **OpenAPI-generated typed client** (no DAO/entity boilerplate) | ✅ (deliberate divergence, §10) |
| Server auth (`Authenticator`, `@Authenticated`), logout | `services/`, `security/`, `Layout` | `Authenticator` via generated `authenticate`; logout → session invalidation | ✅ |
| tapestry-kaptcha (`KaptchaImage`/`KaptchaField`) | `Signup` | API-generated + verified challenge (Option B); mock backend | ✅ |
| `Workspace`, `YourBookings`, `AjaxLoader` components | `components/`, `Book` | registered stubs (`Workspace` renders nothing; `AjaxLoader` a placeholder span) | 🟡 stubs |

## Data access — the deliberate divergence (PLAN §10)

Tapestry backs data access with a Hibernate `CrudServiceDAO`. Qloom does **not**
port that — the data seam is the one place Qloom improves on Tapestry rather than
mirroring it. The developer points at an OpenAPI contract; Qloom generates a
fully-typed `fetch` client + schema types (into a gitignored out-of-source
cache), so there are **no entity classes, no DAO, no signatures** to hand-write:

```ts
// dal/BookingApi.ts — the entire hand-written file (a one-line re-export)
export { api as bookingApi } from "@dal/hotel-booking";
export type { Hotel, User } from "@dal/hotel-booking";

// usage in a page — operations + types come from the committed .openapi.json:
import { bookingApi, type Hotel } from "../../dal/BookingApi";
export class View extends Page {
  @Property hotel: Hotel | null = null;
  override async onActivate(ctx: readonly string[]) {
    this.hotel = await bookingApi.getHotel({ id: Number(ctx[0]) });
  }
}
```

Reference-app note: hotel-booking has no published spec, so the port hand-authors
a small **committed** `hotel-booking.openapi.json` (hotel/booking/user + captcha
operations); a mock `fetch` in `services/auth.ts` serves seed data. Generated TS
is never committed (`.qloom/dal/` cache).

**Seams that don't port 1:1** (documented, not hidden):
- `CrudServiceDAO` + Hibernate → OpenAPI-generated client; the backend owns persistence and transactions (`@CommitAfter` has no client analogue).
- `@SessionState`/`@Persist` → an **encrypted browser store** (in-memory cache + `sessionStorage`/`localStorage`). Client-side encryption is at-rest obfuscation + tamper-evidence, **not** confidentiality against the user; there is no server session, so it can't be. Cross-tab sharing and true opacity are the inherent gaps.
- `Authenticator` / `@Authenticated` → the **backend authorises every call** (PLAN §8); the client merely carries a token. Generated URLs are never a security boundary.
- **tapestry-kaptcha** → server-session captcha can't run in a browser-only SPA, so the challenge is generated + verified behind the **API** (`configureCaptcha` provider + `newCaptcha`/`verifyCaptcha`); swap the mock for a real endpoint or a managed provider (Turnstile/reCAPTCHA) with no Qloom change.

## The automated gate

This scorecard is executed, not just tracked. The hotel-booking app is **ported
to Qloom** under `reference/hotel-booking/` (porting rules and layout in PLAN §13)
and driven in a real browser by Playwright:

```sh
pnpm run test:reference-app   # 40 checks + an end-to-end journey (Signin→Search→View→Book→Confirm)
pnpm run uat:reference-app    # launch the app for manual inspection (login JohnDoe/secret)
```

Every row above is backed by assertions. Supporting framework features have their
own example gates: `examples/data` (11, OpenAPI client), `examples/forms` (12,
forms + `<t:block>`/`<t:delegate>` wizard), `examples/router` (3, `@Persist`
scopes + `@SessionState` create), `examples/graphql` (2, Either-returning GraphQL
DAL). A milestone is **done** only when its checks are green.

## Remaining

- **Signup** is fully ported; the original relied on a server-side Kaptcha jar, which Qloom reworks as an API contract (above).
- `Workspace`/`YourBookings` are stubs — the "booking in progress" side panel is not functionally rendered (post-v1 polish; tracked in [BACKLOG.md](BACKLOG.md) §5).
- SSR/hydration is a **non-goal** (PLAN §12): Qloom is browser-only by design.

With every page ported and the gate green, the reference port is
**feature-complete**; further work is polish, hardening, or new app features
rather than framework milestones.

The built-in component library's remaining parity gaps (tracked in
[BACKLOG.md](BACKLOG.md)) are likewise **all closed** (2026-08-01): `Select`
`blankOption`, `Loop` `element`/`empty`, `Submit` `mode`, `FormFragment`
hidden-field exclusion, keyed `AjaxFormLoop` rows, a Form/`LinkSubmit`
double-submit guard, `KaptchaImage` refresh, `Palette` move controls, the
`Alerts` model (severity/markup/dismiss + `AlertStorage`), and Router
percent-encoding of the activation context. Each is covered by the
`@qloom/component-tests` conformance suite (436 checks), run with
`pnpm --filter @qloom/component-tests test`.

## Mixin system

Tapestry's mixin subsystem is **fully ported** (2026-08-14) — attach behaviour to a
host component without subclassing it — faithful to `tapestry-core`'s
`corelib/mixins` and the mixin-transform workers:

| Area | Qloom | Status |
|---|---|:---:|
| **Engine** — render-phase interleaving (before-mixins → host → after-mixins), after-phase order reversal, and the full return-value protocol (first participant to return a boolean aborts the rest, so a mixin's `true` overrides a host's `false`) | `core/driveInstance` | ✅ |
| **`t:mixins="a, b"`** — attach registry mixins to one component usage | compiler + `core/renderComponent` | ✅ |
| **`@Mixin(name, { order })`** — *implementation mixin*: a class always carries the mixin (collected up the prototype chain), with `before:`/`after:` ordering and fail-loud duplicate rejection | `runtime/Mixin` + `core/resolveMixins` | ✅ |
| **`@InjectContainer`** — a mixin reaches its host component | `runtime/InjectContainer` | ✅ |
| **`@BindParameter(...names)`** — a mixin field two-way-bound to a host parameter | `runtime/BindParameter` | ✅ |
| **`@Environmental(token)`** + `Environment` — render-scoped ambient injection (the anti-prop-drilling primitive) | `runtime/Environmental` + `core/Environment` | ✅ |
| **Mixins** — `Confirm`, `DiscardBody`, `RenderDisabled` (auto-applied to the `Field` base), `ZoneRefresh`, `TriggerFragment`, `Autocomplete` (+ `EchoValue` demo) | `@qloom/components` | ✅ |

Tapestry's `@Mixins`/`@MixinClasses` (attach mixins to a Java-declared `@Component`
field) are intentionally **not** ported — Qloom declares embedded components in the
template, where `t:mixins` already covers that case. Covered by the
`@qloom/component-tests` suite (`Mixins`, `ClassMixin`, `Environmental`,
`ZoneRefresh`, `TriggerFragment`, `Autocomplete`, `ReturnProtocol` specs) and
documented for agents in `.agents/skills/mixins/SKILL.md`.
