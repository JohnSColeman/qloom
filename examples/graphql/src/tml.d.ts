declare module "*.tml" {
  import type { RenderProgram } from "@qloom/core";
  const render: RenderProgram;
  export default render;
}
