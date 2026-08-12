import { Component, Parameter } from "@qloom/runtime";
import type { MarkupWriter, RenderBody } from "@qloom/core";

/**
 * Renders the Block passed to its `to` parameter, or nothing if unbound.
 * Tapestry: `Delegate`. (Block/parameter support is limited until later, so for
 * now `to` is a RenderBody callback or undefined.)
 */
export class Delegate extends Component {
  @Parameter({ required: true }) to: unknown;

  beginRender(writer: MarkupWriter): boolean {
    const to = this.to;
    if (typeof to === "function") (to as RenderBody)(writer);
    return false; // Delegate has no body of its own
  }
}
