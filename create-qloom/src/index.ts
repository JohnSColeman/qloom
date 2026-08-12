/**
 * create-qloom — the Vite plugin, project scaffolder, and skills/schema install.
 *
 * - `create-qloom/vite` — the Vite plugin (`.tml` compile, DAL codegen, message
 *   consolidation).
 * - `scaffold(dir)` — generate a new Qloom app (wired with the plugin, a sample
 *   page + template + messages) and sync the authoring skills into it. Exposed as
 *   the `create-qloom` CLI (`npm create qloom <dir>`).
 * - `installSkills` / `installSchema` — sync the authoring skills / Tapestry
 *   template schema into an existing project.
 */
import { syncSkills, syncSchema } from "@qloom/skills/sync";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

export { qloomVitePlugin } from "./vite-plugin.js";

const here = path.dirname(fileURLToPath(import.meta.url)); // dist/ (or src/ in-repo)

/** The installed create-qloom version, so the scaffolded app pins matching
 *  `@qloom/*` dependencies. */
function ownVersion(): string {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(here, "..", "package.json"), "utf8")) as {
      version?: string;
    };
    return pkg.version ?? "latest";
  } catch {
    return "latest";
  }
}

/**
 * Scaffold a new Qloom app into `targetDir`: copy the template (Vite config wired
 * with the plugin, `index.html`, a sample `Index` page + `.tml` + `app.properties`,
 * a self-contained `tsconfig`), pin `@qloom/*` to this create-qloom's version, and
 * sync the authoring skills into `.agents/skills/`. Returns the resolved target.
 */
export async function scaffold(targetDir?: string): Promise<string> {
  if (!targetDir) {
    throw new Error("create-qloom: a target directory is required — e.g. `npm create qloom my-app`.");
  }
  const target = path.resolve(targetDir);
  if (fs.existsSync(target) && fs.readdirSync(target).length > 0) {
    throw new Error(`create-qloom: ${target} already exists and is not empty.`);
  }
  const templateDir = path.join(here, "..", "template");
  if (!fs.existsSync(templateDir)) {
    throw new Error(`create-qloom: template directory not found at ${templateDir}.`);
  }
  copyTemplate(templateDir, target, {
    __APP_NAME__: path.basename(target),
    __QLOOM_VERSION__: ownVersion(),
  });
  await installSkills(target);
  return target;
}

/** Recursively copy the template, substituting `__VAR__` placeholders in text and
 *  restoring `_gitignore` → `.gitignore` (npm strips a real `.gitignore` from the
 *  published package). */
function copyTemplate(src: string, dest: string, vars: Record<string, string>): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name === "_gitignore" ? ".gitignore" : entry.name);
    if (entry.isDirectory()) copyTemplate(from, to, vars);
    else fs.writeFileSync(to, substitute(fs.readFileSync(from, "utf8"), vars));
  }
}

function substitute(text: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((out, [key, value]) => out.split(key).join(value), text);
}

/**
 * Install Qloom's authoring skills into a project's `.agents/skills/` so an AI
 * coding agent discovers them. Re-run after upgrading Qloom to track API changes.
 * (The `qloom-skills` CLI from `@qloom/skills` does the same from the shell.)
 */
export function installSkills(projectRoot?: string): Promise<string[]> {
  return syncSkills(projectRoot);
}

/**
 * Install Qloom's bundled Tapestry template schema into a project's `schema/` so a
 * `.tml`'s `xmlns:t="…/tapestry_5_4.xsd"` declaration resolves locally (e.g. for an
 * IDE's XML validator). Returns the schema file names copied.
 */
export function installSchema(projectRoot?: string): Promise<string[]> {
  return syncSchema(projectRoot);
}
