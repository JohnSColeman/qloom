import { Component, Environmental } from "@qloom/runtime";
import type { MarkupWriter } from "@qloom/core";
import { Renderable } from "./Renderable.js";

/** Tapestry app1 `RenderableUser`: injects the ambient Renderable via
 *  @Environmental — no parameter, no reference to the provider — and renders it.
 *  Proves the value crosses the component boundary through the Environment. */
export class RenderableUser extends Component {
  @Environmental(Renderable) private renderable!: Renderable;

  beginRender(writer: MarkupWriter): void {
    this.renderable.render(writer);
  }
}
