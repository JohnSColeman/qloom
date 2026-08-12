#!/usr/bin/env node
// `npm create qloom <dir>` / `npx create-qloom <dir>` — scaffold a new Qloom app.
import { scaffold } from "../dist/index.js";

const target = process.argv[2];
try {
  const dir = await scaffold(target);
  const rel = process.argv[2];
  console.log(
    `\n  ✔ Created a Qloom app in ${dir}\n\n  Next:\n    cd ${rel}\n    npm install\n    npm run dev\n`,
  );
} catch (error) {
  console.error(`\n  ✖ ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
