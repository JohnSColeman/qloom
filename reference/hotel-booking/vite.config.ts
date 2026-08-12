import { defineConfig, type Plugin, type ResolvedConfig } from "vite";
import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { qloomVitePlugin } from "create-qloom/vite";

// GitHub Pages has no SPA fallback — an unknown path serves 404.html. Copying the
// built index.html to 404.html makes any deep-link or reload boot the SPA, which
// then routes client-side. The built index.html already carries base-prefixed
// asset URLs, so the copy is correct under a project-site sub-path too.
function spaPagesFallback(): Plugin {
  let outDir = "dist";
  return {
    name: "qloom-spa-pages-fallback",
    apply: "build",
    configResolved(config: ResolvedConfig) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      try {
        copyFileSync(resolve(outDir, "index.html"), resolve(outDir, "404.html"));
        // eslint-disable-next-line no-console
        console.log("qloom: wrote 404.html (SPA deep-link fallback for GitHub Pages)");
      } catch {
        /* no index.html to mirror (non-default build) */
      }
    },
  };
}

export default defineConfig({
  // "/" in dev and for a plain build; the Pages workflow sets BASE_PATH to the
  // repo name (e.g. "/qloom/") so assets and routes resolve under the sub-path.
  base: process.env.BASE_PATH || "/",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [qloomVitePlugin() as any, spaPagesFallback()],
  server: { port: 5180 },
});
