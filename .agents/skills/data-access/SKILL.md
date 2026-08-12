---
name: data-access
description: "Fetching data in Qloom — the dal/ OpenAPI convention, the build-time-generated typed client, the dal/*.ts re-export wrapper, configureData (baseUrl/fetch/headers), and calling operations from onActivate and event handlers. Use when adding a backend call, a new API operation, or wiring a mock backend."
---

# Data Access

Data access is Qloom's **one deliberate divergence** from Tapestry. Instead of an `@Inject`-ed server
DAO, you point at an **OpenAPI contract** and Qloom generates a fully-typed `fetch`-based client at
build time. The contract is the source of truth — there's no entity or DAO boilerplate. Pages `await`
the generated operations, typically in an async `onActivate`.

Qloom is a browser-only SPA: **all data is fetched at runtime via this client**; business logic and
persistence live behind the real API. The backend authorises every request — client state is never a
security boundary.

## The `dal/` convention

Each app has a `dal/` directory holding, per API:

1. **A committed OpenAPI spec** — `dal/<name>.openapi.json` (the contract; versioned like a lockfile).
2. **A one-line re-export wrapper** — `dal/<Name>.ts`, the only hand-written module:

```ts
// dal/BookingApi.ts
export { api as bookingApi } from "@dal/hotel-booking";
export type { Hotel, User, BookingRecord } from "@dal/hotel-booking";
```

The Vite plugin discovers `dal/*.openapi.json` at build time, generates a typed client + schema types
into a **gitignored `.qloom/dal/` cache**, and exposes it via the `@dal/*` import alias (mirrored in
the app's `tsconfig.json` `paths`):

```jsonc
// tsconfig.json
"paths": { "@dal/*": ["./.qloom/dal/*"] }
```

Generated code is **never committed** — delete `.qloom/` and it regenerates. You import from your
`dal/<Name>.ts` wrapper, never from `@dal/*` directly in pages.

## The OpenAPI spec

Standard OpenAPI 3, authored as JSON. Each path operation needs an `operationId` (which becomes the
client method name); schemas under `components/schemas` become exported TS interfaces:

```jsonc
{
  "openapi": "3.0.3",
  "paths": {
    "/hotels/{id}": {
      "get": {
        "operationId": "getHotel",
        "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "integer" } }],
        "responses": { "200": { "content": { "application/json": {
          "schema": { "$ref": "#/components/schemas/Hotel" } } } } }
      }
    }
  },
  "components": { "schemas": { "Hotel": { "type": "object", "properties": { /* … */ } } } }
}
```

Qloom ships its own minimal generator (objects/arrays/`$ref`/enums, path + query params, JSON request
bodies, a 200/201 JSON response) — enough for an app-authored spec, zero runtime deps. For specs using
features beyond that subset (discriminators, `allOf`, complex serialisation), `openapi-typescript` is
the documented drop-in build-time devDependency.

## Configuring the client

Point the generated client at a backend **once, globally**, in `main.ts` via `Data.configureData`:

```ts
import { Data } from "@qloom/data";
Data.configureData({
  baseUrl: "/api",
  fetch: mockFetch(),                          // optional: a custom fetch (real API uses global fetch)
  headers: () => ({ authorization: `Bearer ${token}` }),  // optional: per-request headers
});
```

- `baseUrl` — prefixed to every operation path.
- `fetch` — swap in a mock for tests/examples; omit to use the global `fetch`.
- `headers` — a function invoked per request (for auth tokens, etc.).

## Calling operations

Operation names, parameters, and return types all come from the spec — the editor autocompletes them,
and a spec change surfaces as a type error. Every operation is **async** (returns a `Promise`).

### In `onActivate` (the common case)

```ts
import { bookingApi, type Hotel } from "../../dal/BookingApi";

export class View extends Page {
  @Property hotel: Hotel | null = null;
  override async onActivate(ctx: readonly string[]): Promise<void> {
    this.hotel = await bookingApi.getHotel({ id: Number(ctx[0]) });   // path param
  }
}
```

### In an event handler

```ts
async onSubmitFromLoginForm(): Promise<unknown> {
  try { await bookingApi.authenticate({ body: { username: this.username, password: this.password } }); return "index"; }
  catch (e) { return e instanceof Error ? e.message : "Login failed"; }
}
```

Parameters are passed as one object: path/query params by name, and a request body under `body`. A
failed response (non-2xx) throws an `ApiError` carrying `method`, `path`, `status`, and **`body`** —
the parsed JSON error body when the response was JSON, else the raw text (else `undefined`). Catch it
to surface the server's own message (see `forms-and-validation` for turning it into a form error);
`ApiError.messageOf(err.body)` extracts a `message`/`error`/`detail`/`title` string, and `err.message`
already includes that hint. An error you **don't** catch (e.g. a failed fetch in `onActivate`)
propagates to the router's boundary and is reported via `ErrorReporter` (a generic error page is
shown) rather than lost.

```ts
try {
  await bookingApi.authenticate({ body: creds });
} catch (e) {
  if (e instanceof ApiError && e.status === 401) return "Invalid username or password";
  throw e; // unexpected — let the ErrorReporter boundary handle it
}
```

> A 2xx response whose body is **not** valid JSON (e.g. an HTML error page a proxy served with a 200)
> is also surfaced as an `ApiError` (status `200`, `body` = the raw text) — never a bare `SyntaxError`.
> So `e instanceof ApiError` is safe to branch on.

### Refreshing a Zone after data loads

When data arrives outside activation (e.g. an Ajax search), mutate the state a `Zone` renders and call
`Zones.refreshZone(id)` — see `render-lifecycle` and `forms-and-validation`.

## Mock backends (examples & tests)

Examples serve seed data with a mock `fetch` so there's no server. Provide it via `configureData`:

```ts
Data.configureData({ baseUrl: "/api", fetch: mockFetch() });
```

The reference app does the same for hotels/bookings/users and even the captcha challenge (behind
`Captcha.configureCaptcha({ newChallenge: () => bookingApi.newCaptcha({}) })`). Swapping in a real API
is a config-only change.

## Boundaries

- **Async only** — every operation returns a `Promise`; `await` in `onActivate` or a handler.
- **The backend authorises** — the client runs in the user's browser; it's UX convenience, never a security boundary. Every endpoint authorises independently.
- **Deterministic** — the spec is a committed snapshot (regenerated deliberately, like a lockfile), so offline/CI builds are reproducible.
- **Not an ORM** — the client maps calls to endpoints; no identity map, cache, or unit-of-work.

## Checklist

1. Add/extend `dal/<name>.openapi.json` (each operation needs an `operationId`; schemas under `components/schemas`).
2. Re-export the generated client + types from a one-line `dal/<Name>.ts` wrapper.
3. `Data.configureData({ baseUrl, fetch?, headers? })` once in `main.ts`.
4. `await api.<operationId>({ …params, body? })` in an async `onActivate` or event handler; catch `ApiError`.
5. Never commit `.qloom/`; delete it to regenerate. `pnpm build` / the Vite plugin regenerate the client.
