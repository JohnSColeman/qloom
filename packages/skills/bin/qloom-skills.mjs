#!/usr/bin/env node
import { syncSkills, syncSchema } from "../sync.mjs";

const [cmd, ...rest] = process.argv.slice(2);

function usage(code) {
  const out = code ? console.error : console.log;
  out("usage: qloom-skills sync [--to <project-dir>] [--subdir <path>] [--no-schema]");
  out("  Copies Qloom's authoring skills into <project-dir>/.agents/skills/ (default cwd),");
  out("  and the Tapestry template schema into <project-dir>/schema/ (skip with --no-schema).");
  process.exit(code);
}

if (cmd !== "sync") usage(cmd ? 1 : 0);

const opts = {};
let to;
let withSchema = true;
for (let i = 0; i < rest.length; i++) {
  if (rest[i] === "--to") to = rest[++i];
  else if (rest[i] === "--subdir") opts.subdir = rest[++i];
  else if (rest[i] === "--no-schema") withSchema = false;
  else {
    console.error(`qloom-skills: unknown argument "${rest[i]}"`);
    usage(1);
  }
}

const root = to ?? process.cwd();
try {
  const names = await syncSkills(root, opts);
  console.log(`qloom: synced ${names.length} skill(s) to ${opts.subdir ?? ".agents/skills"}/`);
  for (const n of names) console.log(`  - ${n}`);
  if (withSchema) {
    const files = await syncSchema(root);
    console.log(`qloom: synced ${files.length} schema file(s) to schema/`);
    for (const f of files) console.log(`  - ${f}`);
  }
} catch (e) {
  console.error(`qloom-skills: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
}
