import { Page, Property } from "@qloom/runtime";

/** Renders a PhaseRec, then shows the recorded phase order — which must include
 *  beforeRenderTemplate/afterRenderTemplate in the right positions. */
export class PhaseOrderDemo extends Page {
  @Property order: string[] = [];
}
