import { Component, Parameter } from "@qloom/runtime";
import { applyInformals } from "@qloom/core";
import type { MarkupWriter } from "@qloom/core";

/**
 * Tapestry: `Any` — renders an arbitrary element (named by its `element`
 * parameter, default "div") including any informal parameters, around its body.
 */
export class Any extends Component {
  @Parameter() element = "div";

  beginRender(writer: MarkupWriter): boolean {
    writer.element(this.element);
    applyInformals(writer, this);
    return true; // render the body
  }
  afterRender(writer: MarkupWriter): void {
    writer.end();
  }
}
