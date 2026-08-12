# @qloom/skills

Qloom's authoring skills for AI coding agents — the `SKILL.md` guides for writing
pages, components, templates, forms, routing, and data access — plus the bundled
Tapestry template schema (`schema/tapestry_5_4.xsd`), packaged so a **consuming app**
(Qloom as an npm dependency) can install them into its own repo, where its agent
will discover the skills and its IDE can resolve a `.tml`'s `xmlns:t` locally.

## Why

Agent harnesses discover skills from a project's `.agents/skills/` (or
`.claude/skills/`), and from installed plugins — **not** from `node_modules`. So a
framework can't just ship skills in a package and expect them to be found; the
files have to be copied into the consuming project. This package + its CLI do that.

## Use (in a Qloom app)

```sh
npx qloom-skills sync            # copy skills into ./.agents/skills/
npx qloom-skills sync --to .     # explicit target project root
npx qloom-skills sync --subdir .claude/skills   # e.g. for Claude Code's dir
```

Re-run after upgrading `@qloom/*` so the guidance tracks the API you're on. The
scaffolder (`npm create qloom`) runs it on init.

Programmatic:

```js
import { syncSkills, syncSchema, skillsDir, schemaDir } from "@qloom/skills/sync";
await syncSkills(projectRoot);   // → <projectRoot>/.agents/skills/
await syncSchema(projectRoot);   // → <projectRoot>/schema/tapestry_5_4.xsd
```

The `qloom-skills sync` CLI copies both by default (pass `--no-schema` to skip the
schema). The bundled xsd is also importable by path via the `./schema/*` export
(e.g. `@qloom/skills/schema/tapestry_5_4.xsd`).

## Source of truth

The canonical skills live at the repo root **`.agents/skills/`** and the Tapestry
template schema at the repo root **`schema/`** (both also used by the Qloom monorepo
itself). `scripts/bundle.mjs` copies them into this package's `skills/` and
`schema/` at publish time; in-repo the package reads the repo-root sources directly.
Edit the skills in `.agents/skills/` and the schema in `schema/`.
