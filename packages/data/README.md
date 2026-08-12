# @qloom/data

A tiny, **zero-dependency `fetch` runtime** — the only thing the generated data
clients depend on at runtime. Qloom's one deliberate divergence from Tapestry is
data access: instead of a server DAO, a contract is compiled into a fully-typed
client at build time (see [`@qloom/compiler`](../compiler)). Two generators feed
this runtime, and both ship nothing but Qloom + generated code to the browser:

- **REST / OpenAPI** — a `dal/*.openapi.json` contract → a client whose methods
  call `Data.request()`, returning the response body or throwing `ApiError`.
- **GraphQL** — a `dal/<name>/` directory (vendored schema + operation documents)
  → a client whose methods call `Data.graphql()`, returning an
  `Either<GraphqlError, T>` the caller `.fold`s over (never throws).

**App code calls the generated methods, never `Data.request` / `Data.graphql`
directly.** Apps re-export the generated client through a small wrapper, e.g.
`export { api as bookingApi } from "@dal/hotel-booking"` (REST) or
`export { api as swapiApi } from "@dal/swapi"` (GraphQL).

## API

- **`Data`** — a static class:
  - `Data.configureData(config)` — set the base URL, default headers, auth hook,
    etc. (`DataConfig` in `types.d.ts`). Called once in the app's `main.ts`.
  - `Data.request(options)` — the low-level request the generated client calls
    (`RequestOptions` in `types.d.ts`). Resolves the response body or throws
    `ApiError`.
- **`ApiError`** — thrown on a non-OK response; carries the status and error body
  so callers can branch on failure.

### GraphQL (the second DAL generator)

**Authoring a client.** A GraphQL client is a `dal/<name>/` directory: a vendored
schema plus the operation documents your app authors. The Vite plugin compiles it
to a typed client (one method per named operation, its result type exactly the
selected subtree) into the gitignored `.qloom/dal/` cache, exposed via `@dal/*`.

```
dal/
  swapi/
    schema.graphql          # vendored schema (type-system definitions)
    films.graphql           # query GetFilm($id: ID!) { film(id: $id) { title … } }
  Swapi.ts                  # export { api as swapiApi } from "@dal/swapi"
```

Unmapped custom scalars become `unknown` + a build warning (refine them via the
plugin's `graphqlScalars`); anonymous / duplicate / `subscription` operations and
anything that fails schema validation fail the build. See
[`@qloom/compiler`](../compiler) and PLAN §10.10.

Generated GraphQL clients **don't throw**; they return an `Either`. The runtime
pieces they lean on:

- **`Data.graphql<T>(document, variables?)`** → `Promise<Either<GraphqlError, T>>` —
  POSTs `{ query, variables }` to `baseUrl + graphqlEndpoint`. Never throws for
  expected failures: success → `Either.right(data)`; a non-empty response `errors`
  array → `Either.left(GraphqlError.graphql(...))` with the partial `data` attached;
  a network / non-2xx / unparseable response → `Either.left(GraphqlError.transport(...))`.
- **`Either<L, R>`** — a functional result (`Right` = success, `Left` = failure).
  Callers `.fold(onLeft, onRight)` instead of try/catch; also `map` / `mapLeft` /
  `flatMap` / `getOrElse` / `isLeft` / `isRight`.
- **`GraphqlError`** — the `Left` value; `kind: "graphql" | "transport"`, plus
  `errors` / `partialData` (graphql) or `status` / `cause` (transport).
- **`DataConfig.graphqlEndpoint`** — the GraphQL path, prefixed by `baseUrl`.
  Default `"/graphql"`.

```ts
const result = await swapiApi.GetFilm({ id: "1" });
result.fold(
  (err) => showError(err.message),
  (data) => render(data.film),
);
```

## Configure (in your app's `main.ts`)

```ts
import { Data } from "@qloom/data";

// REST + GraphQL share one config: baseUrl, headers/auth, and the fetch override.
Data.configureData({
  baseUrl: "/api",
  graphqlEndpoint: "/graphql", // GraphQL only; default "/graphql", prefixed by baseUrl
  /* headers, auth, fetch, … */
});
```

Zero runtime dependencies — this package is deliberately minimal so the browser
payload stays small. Both the OpenAPI → TS and GraphQL → TS *generation* steps are
build-time concerns living in [`@qloom/compiler`](../compiler); this package is only
the runtime the generated code leans on. Resolves to **source** (`src/index.ts`).
See [CLAUDE.md](../../CLAUDE.md), PLAN §5, and PLAN §10.10 (GraphQL DAL).
