// Ambient types for the Qloom Vite plugin's virtual modules.

// Each `.tml` becomes a module whose default export is a RenderProgram.
declare module "*.tml" {
  import type { RenderProgram } from "@qloom/core";
  const render: RenderProgram;
  export default render;
}

// The app's *.properties message catalogues, consolidated per locale at build time.
declare module "virtual:qloom/messages" {
  const catalogues: Record<string, Record<string, string>>;
  export default catalogues;
}
