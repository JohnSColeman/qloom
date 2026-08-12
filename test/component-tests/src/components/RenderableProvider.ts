import { Component } from "@qloom/runtime";
import { Environment } from "@qloom/core";
import { Renderable } from "./Renderable.js";

/** Tapestry app1 `RenderableProvider`: pushes a Renderable onto the Environment
 *  for the duration of its body render, then pops it. Renders its body only (no
 *  template) — it is transparent, present purely to establish the ambient value. */
export class RenderableProvider extends Component {
  setupRender(): void {
    Environment.push(Renderable, new Renderable("A message provided by the RenderableProvider component."));
  }

  cleanupRender(): void {
    Environment.pop(Renderable);
  }
}
