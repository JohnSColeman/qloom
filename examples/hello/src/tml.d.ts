// Ambient type for compiled `.tml` templates. The Qloom Vite plugin turns each
// `.tml` file into a module whose default export is a RenderProgram.
declare module "*.tml" {
  import type { RenderProgram } from "@qloom/core";
  const render: RenderProgram;
  export default render;
}
