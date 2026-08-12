# create-qloom

The **Vite plugin** that makes a Qloom app build, plus skills/schema installation
and a **planned** project scaffolder. This is the build-time glue between an app
and the framework packages.

## The Vite plugin

`qloomVitePlugin` (imported from `create-qloom/vite`) does two build-time jobs by
delegating to [`@qloom/compiler`](../packages/compiler):

- **Compiles `.tml` imports** into render programs — a `.tml` import becomes the
  `export default function render(...)` module the engine runs. No runtime
  template interpretation (PLAN §5).
- **Generates a typed API client** from each `dal/*.openapi.json` contract into a
  **gitignored `.qloom/dal/`** cache, exposed via the `@dal/*` import alias
  (mirror it in the app's `tsconfig.json` `paths`). Generated code is never
  committed — delete `.qloom/` and it rebuilds. Apps re-export it through a small
  `dal/*.ts` wrapper, e.g. `export { api as bookingApi } from "@dal/hotel-booking"`.
- Runs a **build-time event-handler check** so a template referencing a missing
  handler fails the build.

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { qloomVitePlugin } from "create-qloom/vite";

export default defineConfig({ plugins: [qloomVitePlugin()] });
```

## Skills & schema installation

Thin wrappers over [`@qloom/skills`](../packages/skills):

- **`installSkills(projectRoot?)`** — copy Qloom's authoring skills into a
  project's `.agents/skills/` so an AI coding agent discovers them. Re-run after
  upgrading Qloom. (The `qloom-skills sync` CLI does the same from the shell.)
- **`installSchema(projectRoot?)`** — copy the bundled Tapestry template schema
  into a project's `schema/` so a `.tml`'s `xmlns:t` declaration resolves locally.

## Scaffolder — planned, not yet implemented

`scaffold()` is a stub that **throws**. It's gated on publishing the `@qloom/*`
packages to npm (they are `workspace:*` today). Once built, it will write a new
app's files (a `Page`, its template, `index.html`, a Vite config wired with the
plugin) and run `installSkills`. **Until then, use
[`reference/hotel-booking/src/main.ts`](../reference/hotel-booking/src/main.ts) as
the wiring template** and `npx qloom-skills sync` for the authoring skills.

## Build

Like [`@qloom/compiler`](../packages/compiler), this package builds to `dist`
(`main`/`types` → `./dist`). Run `pnpm build` (`tsc -b`) after changing it.
Depends on `@qloom/compiler` and `@qloom/skills`. See [CLAUDE.md](../CLAUDE.md).
