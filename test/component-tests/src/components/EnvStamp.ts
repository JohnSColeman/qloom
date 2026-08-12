import { Component, MixinAfter, Environmental } from "@qloom/runtime";
import type { MarkupWriter } from "@qloom/core";
import { Renderable } from "./Renderable.js";

/** A mixin that reaches an ambient service published by an ancestor it holds no
 *  reference to — the canonical reason @Environmental matters for mixins. Injects
 *  the ambient Renderable and stamps its message onto the host element. */
@MixinAfter
export class EnvStamp extends Component {
  @Environmental(Renderable) private renderable!: Renderable;

  beginRender(writer: MarkupWriter): void {
    writer.attribute("data-env", this.renderable.toText());
  }
}
