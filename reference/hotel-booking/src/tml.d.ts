declare module "*.tml" {
  import type { RenderProgram } from "@qloom/core";
  const render: RenderProgram;
  export default render;
}

declare module "virtual:qloom/messages" {
  /** `locale → { key: value }` catalogues, "" being the default locale. */
  const catalogues: Record<string, Record<string, string>>;
  export default catalogues;
}
