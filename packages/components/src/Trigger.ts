import { Component, Parameter } from "@qloom/runtime";
import { triggerEvent } from "@qloom/core";
import type { MarkupWriter } from "@qloom/core";

/**
 * Tapestry: `Trigger` — fires an arbitrary event during rendering, passing the
 * MarkupWriter so the container's handler can inject content (Tapestry uses this
 * to add JavaScript via JavaScriptSupport).
 */
export class Trigger extends Component {
  @Parameter() event = "action";

  beginRender(writer: MarkupWriter): boolean {
    triggerEvent(this, this.event, writer);
    return false; // no markup of its own
  }
}
