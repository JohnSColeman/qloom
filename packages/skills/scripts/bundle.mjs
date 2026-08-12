// Bundle the canonical author-facing artifacts — the skills (repo-root
// .agents/skills) and the Tapestry template schema (repo-root schema/) — into this
// package so they ship in the published tarball. Runs on prepublishOnly (and
// manually via `pnpm --filter @qloom/skills bundle`). In-repo the package reads the
// canonical locations directly (see sync.mjs), so bundling is only needed to publish.
import { cp, rm, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..", "..");

async function bundle(name, from) {
  const source = join(repoRoot, from);
  const dest = join(here, "..", name);
  await rm(dest, { recursive: true, force: true });
  await mkdir(dest, { recursive: true });
  await cp(source, dest, { recursive: true });
  console.log(`@qloom/skills: bundled ${from} → ${name}/`);
}

await bundle("skills", ".agents/skills");
await bundle("schema", "schema");
