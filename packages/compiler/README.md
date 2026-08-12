# @qloom/compiler

Qloom's **build-time compiler**. Two offline jobs, both invoked by the Vite plugin
in [`create-qloom`](../../create-qloom) — never at runtime in the browser:

1. **`.tml` → render program.** Each Tapestry `.tml` template is parsed as XML
   (case-sensitive, via `htmlparser2`) and emitted as an ES module
   `export default function render(instance, writer, body)`. `${expr}` and
   bindings compile to closures over the instance; `t:` elements compile to
   `renderComponent(...)` calls; `<t:body/>` becomes `body(writer)`. There is **no
   runtime template interpretation** — this is the whole two-phase performance
   story (PLAN §5).
2. **OpenAPI → typed TS client.** `generateApiClient` turns a `dal/*.openapi.json`
   contract into a fully-typed client that calls [`@qloom/data`](../data)'s
   `Data.request()`. This is Qloom's one deliberate divergence from Tapestry:
   client-side, generated data access instead of a server DAO.

## API

- **`compileTemplate(source, options)`** → `CompileResult` — the template compiler.
  Throws `TemplateCompileError` on malformed templates, unknown schema versions, etc.
- **`collectComponentIds` / `checkEventHandlers`** — build-time checks: gather the
  `t:id`s a template declares, and verify event-handler methods line up (the
  plugin's event-handler check).
- **`generateApiClient(openApiJson, options)`** — the OpenAPI → client generator.
- **`generateGraphqlClient(sources, options?)`** — the **GraphQL** → client generator.
  Takes the `.graphql` files of a `dal/<name>/` directory (a vendored `schema.graphql`
  plus the app's operation documents) and emits a typed module: one
  `api.<Op>(variables)` per named operation, each returning
  `Either<GraphqlError, <Op>Result>` (from [`@qloom/data`](../data)) where the result
  type is exactly the operation's selected subtree. Uses a **build-only `graphql`**
  (graphql-js) dependency for parse/validate/print/selection-set resolution — nothing
  GraphQL-related reaches the browser. Fail-loud on anonymous/duplicate/`subscription`
  operations and any operation that fails `validate(schema, doc)`; unmapped custom
  scalars → `unknown` + a build warning (refine via the plugin's `graphqlScalars`).
  See PLAN §10.10.
- **Expression pipeline** — `tokenizeExpression` → `parseExpression` →
  `emitExpression` / `emitConduit`: the compiler for the binding-expression
  dialect inside `${...}` and `t:` parameter values.
- **`SchemaVersion`** — supported Tapestry template schema versions (the compiler
  gates on the `.tml`'s namespace; `tapestry_5_4.xsd` is bundled via
  [`@qloom/skills`](../skills)).

## This package builds to `dist`

Unlike the source-resolved library packages, `@qloom/compiler` (and `create-qloom`)
compile to `dist` (`main`/`types` → `./dist/index.js`). Run `pnpm build` (`tsc -b`)
after changing it.

## Tests

This is the one package with **`node --test` unit suites** (`test/*.test.mjs`)
rather than Playwright — covering the pure logic: the expression pipeline and the
template-id / event-handler compile checks.

```sh
pnpm --filter @qloom/compiler test
```

Build-time deps only: `htmlparser2` (the `.tml` XML parser) and `graphql`
(graphql-js, used by `generateGraphqlClient`) — neither reaches the browser bundle.
See [CLAUDE.md](../../CLAUDE.md) and PLAN §5.
