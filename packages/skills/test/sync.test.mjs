import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { syncSkills, syncSchema, skillsDir, schemaDir } from "../sync.mjs";

const EXPECTED = [
  "authoring-templates",
  "data-access",
  "forms-and-validation",
  "mixins",
  "render-lifecycle",
  "routing-and-url-state",
  "using-components",
  "writing-components",
  "writing-pages",
];

test("skillsDir resolves to a real directory of SKILL.md files", async () => {
  assert.ok(existsSync(skillsDir), `skillsDir missing: ${skillsDir}`);
  const dirs = (await readdir(skillsDir, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
  for (const name of EXPECTED) assert.ok(dirs.includes(name), `missing skill ${name}`);
});

test("syncSkills copies every skill's SKILL.md into <root>/.agents/skills", async () => {
  const root = await mkdtemp(join(tmpdir(), "qloom-skills-"));
  const names = await syncSkills(root);

  assert.deepEqual(names.sort(), [...EXPECTED].sort());
  for (const name of names) {
    const file = join(root, ".agents", "skills", name, "SKILL.md");
    assert.ok(existsSync(file), `not synced: ${file}`);
    const text = await readFile(file, "utf8");
    assert.match(text, /^---\nname:/, `${name}/SKILL.md missing frontmatter`);
  }
});

test("schemaDir holds tapestry_5_4.xsd for the 5_4 namespace", async () => {
  assert.ok(existsSync(schemaDir), `schemaDir missing: ${schemaDir}`);
  const xsd = join(schemaDir, "tapestry_5_4.xsd");
  assert.ok(existsSync(xsd), `missing ${xsd}`);
  const text = await readFile(xsd, "utf8");
  assert.match(text, /tapestry_5_4\.xsd/, "xsd should target the 5_4 namespace");
});

test("syncSchema copies the schema into <root>/schema", async () => {
  const root = await mkdtemp(join(tmpdir(), "qloom-schema-"));
  const files = await syncSchema(root);
  assert.ok(files.includes("tapestry_5_4.xsd"), `expected tapestry_5_4.xsd, got ${files}`);
  assert.ok(existsSync(join(root, "schema", "tapestry_5_4.xsd")));
});

test("syncSkills honours --subdir and overwrites on re-sync", async () => {
  const root = await mkdtemp(join(tmpdir(), "qloom-skills-"));
  await syncSkills(root, { subdir: ".claude/skills" });
  assert.ok(existsSync(join(root, ".claude", "skills", "writing-pages", "SKILL.md")));

  // A stale local edit is overwritten by the next sync (it's a sync, not a merge).
  const target = join(root, ".claude", "skills", "writing-pages", "SKILL.md");
  await mkdir(join(root, ".claude", "skills", "writing-pages"), { recursive: true });
  await writeFile(target, "STALE");
  await syncSkills(root, { subdir: ".claude/skills" });
  assert.notEqual(await readFile(target, "utf8"), "STALE");
});
