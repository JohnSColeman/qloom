/**
 * The Qloom Vite plugin.
 *   - compiles Tapestry `.tml` template imports → render programs (@qloom/compiler);
 *   - generates a typed client from each `dal/*.openapi.json` (§10) into a
 *     gitignored `.qloom/dal/` cache, exposed via the `@dal/*` import alias;
 *   - consolidates the app's `.properties` message catalogues (Tapestry's static
 *     text) at build time, exposed via the `virtual:qloom/messages` module.
 *
 * Generated code is boilerplate — never committed. Delete `.qloom/` and it
 * rebuilds on the next dev/build.
 */
import {
  compileTemplate,
  collectComponentIds,
  checkEventHandlers,
  generateApiClient,
  generateGraphqlClient,
  parseProperties,
} from "@qloom/compiler";
import type { SchemaVersion } from "@qloom/compiler";
import * as fs from "node:fs";
import * as path from "node:path";

/** Minimal structural subset of Vite's Plugin we implement. */
export interface VitePluginLike {
  name: string;
  enforce?: "pre" | "post";
  config?(): { resolve?: { alias?: Record<string, string> } };
  buildStart?(): void;
  resolveId?(id: string): string | undefined;
  load?(id: string): string | undefined;
  transform(code: string, id: string): { code: string; map: null } | undefined;
}

const VIRTUAL_MESSAGES = "virtual:qloom/messages";
const RESOLVED_MESSAGES = "\0" + VIRTUAL_MESSAGES;
const PROPERTIES_RE = /\.properties$/;
/** A trailing locale suffix on a `.properties` filename, e.g. `_fr` / `_fr_FR`. */
const LOCALE_SUFFIX_RE = /_([a-z]{2,3}(?:_[A-Z]{2})?)\.properties$/;

/** Recursively collect every `.properties` file under `dir`. */
function collectProperties(dir: string, found: string[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return; // dir missing
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectProperties(full, found);
    else if (PROPERTIES_RE.test(entry.name)) found.push(full);
  }
}

/**
 * Consolidate every `<root>/src/**\/*.properties` into one catalogue per locale
 * (Tapestry assembles per-component at runtime; Qloom merges to a single
 * per-locale catalogue at build time — equivalent when keys don't collide). An
 * un-suffixed file (`app.properties`, `Book.properties`) → the default locale
 * (key `""`); a `_<locale>` suffix (`app_fr.properties`) → that locale.
 */
function consolidateMessages(root: string): Record<string, Record<string, string>> {
  const byLocale: Record<string, Record<string, string>> = {};
  const files: string[] = [];
  collectProperties(path.join(root, "src"), files);
  files.sort(); // deterministic merge order
  for (const file of files) {
    const base = path.basename(file);
    const locale = LOCALE_SUFFIX_RE.exec(base)?.[1] ?? "";
    const catalogue = parseProperties(fs.readFileSync(file, "utf8"));
    byLocale[locale] = { ...(byLocale[locale] ?? {}), ...catalogue };
  }
  return byLocale;
}

/** Options for {@link qloomVitePlugin}. */
export interface QloomPluginOptions {
  /**
   * Default Tapestry template schema version for `.tml` files that omit their
   * `xmlns:t` declaration (a template that declares a recognized `xmlns:t` wins).
   * Governs which `t:` directives are legal. Default: `"5.4"`.
   */
  schemaVersion?: SchemaVersion;
  /** Custom GraphQL scalar name → TS type for generated GraphQL clients. */
  graphqlScalars?: Record<string, string>;
}

const TEMPLATE_RE = /\.tml(?:\?.*)?$/;

/** Generate both OpenAPI (`dal/*.openapi.json`) and GraphQL (`dal/<name>/`) clients. */
function generateDal(root: string, options: QloomPluginOptions = {}): void {
  const dalDir = path.join(root, "dal");
  if (!fs.existsSync(dalDir)) return;
  const outDir = path.join(root, ".qloom", "dal");
  fs.mkdirSync(outDir, { recursive: true });

  const specs = fs.readdirSync(dalDir).filter((f) => f.endsWith(".openapi.json"));
  for (const file of specs) {
    const spec = JSON.parse(fs.readFileSync(path.join(dalDir, file), "utf8"));
    const name = file.replace(/\.openapi\.json$/, "");
    fs.writeFileSync(path.join(outDir, `${name}.ts`), generateApiClient(spec));
  }

  generateGraphqlDal(dalDir, outDir, options);
}

/** Generate a GraphQL client for each `dal/<name>/` subdirectory of `.graphql` files. */
function generateGraphqlDal(dalDir: string, outDir: string, options: QloomPluginOptions): void {
  for (const entry of fs.readdirSync(dalDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const clientDir = path.join(dalDir, entry.name);
    const files = fs.readdirSync(clientDir).filter((f) => f.endsWith(".graphql"));
    if (files.length === 0) continue;
    const sources = files.map((f) => ({
      file: f,
      sdl: fs.readFileSync(path.join(clientDir, f), "utf8"),
    }));
    const scalars = options.graphqlScalars;
    const { code, warnings } = generateGraphqlClient(sources, scalars ? { scalars } : {});
    for (const w of warnings) console.warn(`qloom: ${w}`);
    fs.writeFileSync(path.join(outDir, `${entry.name}.ts`), code);
  }
}

export function qloomVitePlugin(options: QloomPluginOptions = {}): VitePluginLike {
  const root = process.cwd();
  const { schemaVersion } = options;
  return {
    name: "Qloom",
    enforce: "pre",
    config() {
      return { resolve: { alias: { "@dal": path.join(root, ".qloom", "dal") } } };
    },
    buildStart() {
      generateDal(root, options);
    },
    resolveId(id) {
      return id === VIRTUAL_MESSAGES ? RESOLVED_MESSAGES : undefined;
    },
    load(id) {
      if (id !== RESOLVED_MESSAGES) return undefined;
      // `{ [locale]: { key: value } }`, "" being the default locale.
      return `export default ${JSON.stringify(consolidateMessages(root))};`;
    },
    transform(code, id) {
      if (!TEMPLATE_RE.test(id)) return undefined;
      const clean = id.replace(/\?.*$/, "");
      const base = clean.split("/").pop() ?? "Template.tml";
      const name = base.replace(/\.tml$/, "");
      // Compile-time guard: the paired class's on<Event>From<Id> handlers must
      // reference a real t:id in this template, or the event silently never
      // fires. Fail the build (with a casing-aware hint) rather than at runtime.
      const classFile = clean.replace(/\.tml$/, ".ts");
      if (fs.existsSync(classFile)) {
        const errors = checkEventHandlers(
          name,
          fs.readFileSync(classFile, "utf8"),
          collectComponentIds(code),
        );
        if (errors.length) throw new Error(`qloom: ${errors.join("\n       ")}`);
      }
      const result = compileTemplate(code, { name, schemaVersion });
      return { code: result.code, map: null };
    },
  };
}

/** Build-time entry so `dal/*` clients can be generated outside Vite (editor/CI). */
export function generateDalClients(root: string = process.cwd(), options: QloomPluginOptions = {}): void {
  generateDal(root, options);
}
