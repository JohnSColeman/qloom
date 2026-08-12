# Reference app — Hotel Booking (Qloom parity gate)

A faithful port of the Apache Tapestry **hotel-booking** demo to Qloom, used as
the executable feature-parity gate. See [PLAN.md §13](../../PLAN.md) for the full
specification and [PARITY.md](../../PARITY.md) for the scorecard.

## Provenance & licence

Ported from **[ccordenier/tapestry5-hotel-booking](https://github.com/ccordenier/tapestry5-hotel-booking)**,
which is licensed under the **Apache License 2.0** (`Copyright 2009`). The `.tml`
templates are reused verbatim with attribution; Java classes are hand-ported to
TypeScript. Retain the upstream `LICENSE`/`NOTICE` when the sources are copied in.

## Porting rules (PLAN §13.1)

1. **Java → TypeScript**, same class names/structure; annotations kept as close
   as the Qloom decorator surface allows (`@Property`, `@Inject`, `@InjectComponent`,
   `@OnEvent`, `@Persist`, render-phase decorators). Handler naming unchanged.
2. **`.tml` templates copied byte-for-byte.** Editing a template to make it render
   is an Qloom bug, not a port step — that is the point of the gate.
3. **A committed OpenAPI spec + mock `fetch` replace the database.** A hand-authored
   `hotel-booking.openapi.yaml` describes the operations; Qloom generates the typed
   client (PLAN §10), and a mock `fetch` serves the seed data. No server, no Hibernate.
4. **Structure preserved** — `pages/`, `components/`, `services/`, plus `dal/`.
5. **Server/runtime cruft dropped** — `web.xml`, servlet wiring, server `AppModule`
   bindings, `hibernate.cfg.xml`, `pom.xml`, WAR packaging.

## Intended layout

```
src/
  pages/       Index, Search, View, Book, Settings, Signin, Signup   (.ts + .tml)
  components/  Layout, Workspace, HotelClass, YourBookings, AjaxLoader, security/Authenticated
  dal/         BookingApi (defineApi) + hotel-booking.openapi.yaml + seed data + mock fetch
  services/    Authenticator (client stub), app bootstrap/registry
  main.ts      install mock fetch + Router.start()
tests/
  reference-app.spec.ts   Playwright checks, tagged by milestone (§13.4)
```

## Running the gate

```sh
pnpm run test:reference-app
```

**Status:** *pending.* Today this reports the milestone gate map (placeholder
runner at `reference/run-gate.mjs`). The Playwright harness and the first ported
pages land at **M2**; the suite reaches full green (v1 parity) at **M6**.
