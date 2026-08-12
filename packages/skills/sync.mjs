import { cp, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * The skills source directory. In the published package this is the bundled
 * `skills/` copy; inside the Qloom monorepo (where `skills/` isn't bundled) it
 * falls back to the canonical `.agents/skills/`, so the CLI works from source.
 */
export const skillsDir = existsSync(join(here, "skills"))
  ? join(here, "skills")
  : join(here, "..", "..", ".agents", "skills");

/**
 * The Tapestry template schema directory. In the published package this is the
 * bundled `schema/` copy; inside the Qloom monorepo (where `schema/` isn't bundled
 * here) it falls back to the canonical repo-root `schema/`. Holds the
 * `tapestry_5_4.xsd` a `.tml`'s `xmlns:t` declaration resolves to.
 */
export const schemaDir = existsSync(join(here, "schema"))
  ? join(here, "schema")
  : join(here, "..", "..", "schema");

/**
 * Copy Qloom's authoring skills into a project so an AI coding agent discovers
 * them. Overwrites existing copies (it's a sync), so re-run after upgrading Qloom
 * to track API changes.
 *
 * @param {string} [projectRoot]  target project root (default: process.cwd())
 * @param {{ subdir?: string, source?: string }} [opts]
 *   subdir — location under the project (default ".agents/skills")
 *   source — override the skills source directory
 * @returns {Promise<string[]>} the skill names synced
 */
export async function syncSkills(projectRoot = process.cwd(), opts = {}) {
  const source = opts.source ?? skillsDir;
  if (!existsSync(source)) throw new Error(`qloom: skills source not found at ${source}`);
  const dest = join(projectRoot, opts.subdir ?? ".agents/skills");
  await mkdir(dest, { recursive: true });

  const names = (await readdir(source, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  for (const name of names) {
    await cp(join(source, name), join(dest, name), { recursive: true });
  }
  return names;
}

/**
 * Copy Qloom's bundled Tapestry template schema into a project so a `.tml`'s
 * `xmlns:t` declaration can be resolved locally (e.g. by an IDE's XML validator).
 * Overwrites existing copies (it's a sync).
 *
 * @param {string} [projectRoot]  target project root (default: process.cwd())
 * @param {{ subdir?: string, source?: string }} [opts]
 *   subdir — location under the project (default "schema")
 *   source — override the schema source directory
 * @returns {Promise<string[]>} the schema file names synced
 */
export async function syncSchema(projectRoot = process.cwd(), opts = {}) {
  const source = opts.source ?? schemaDir;
  if (!existsSync(source)) throw new Error(`qloom: schema source not found at ${source}`);
  const dest = join(projectRoot, opts.subdir ?? "schema");
  await mkdir(dest, { recursive: true });

  const files = (await readdir(source, { withFileTypes: true }))
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .sort();
  for (const file of files) {
    await cp(join(source, file), join(dest, file));
  }
  return files;
}
