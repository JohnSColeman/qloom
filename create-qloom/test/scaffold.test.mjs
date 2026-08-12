import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { scaffold } from "../dist/index.js";

function tmpTarget(name) {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "qloom-scaffold-")), name);
}

test("scaffolds the expected app files", async () => {
  const target = tmpTarget("my-app");
  const dir = await scaffold(target);
  assert.equal(dir, target);
  for (const f of [
    "package.json",
    "vite.config.ts",
    "tsconfig.json",
    "index.html",
    ".gitignore", // restored from _gitignore
    "README.md",
    "src/main.ts",
    "src/tml.d.ts",
    "src/app.properties",
    "src/pages/Index.ts",
    "src/pages/Index.tml",
  ]) {
    assert.ok(fs.existsSync(path.join(target, f)), `missing ${f}`);
  }
});

test("substitutes the app name and pins the Qloom version", async () => {
  const target = tmpTarget("acme-portal");
  await scaffold(target);
  const pkg = JSON.parse(fs.readFileSync(path.join(target, "package.json"), "utf8"));
  assert.equal(pkg.name, "acme-portal");
  assert.doesNotMatch(JSON.stringify(pkg), /__APP_NAME__|__QLOOM_VERSION__/);
  // deps pin a real semver range, not the placeholder
  assert.match(pkg.dependencies["@qloom/core"], /^\^\d+\.\d+\.\d+/);
  assert.match(pkg.devDependencies["create-qloom"], /^\^\d+\.\d+\.\d+/);
  assert.equal(fs.readFileSync(path.join(target, "index.html"), "utf8").includes("acme-portal"), true);
});

test("installs the authoring skills into .agents/skills", async () => {
  const target = tmpTarget("skilled");
  await scaffold(target);
  const skillsDir = path.join(target, ".agents", "skills");
  assert.ok(fs.existsSync(skillsDir), ".agents/skills not created");
  assert.ok(fs.readdirSync(skillsDir).length > 0, "no skills synced");
});

test("refuses a non-empty target", async () => {
  const target = tmpTarget("occupied");
  fs.mkdirSync(target, { recursive: true });
  fs.writeFileSync(path.join(target, "keep.txt"), "x");
  await assert.rejects(() => scaffold(target), /already exists and is not empty/);
});

test("requires a target directory", async () => {
  await assert.rejects(() => scaffold(), /target directory is required/);
});
