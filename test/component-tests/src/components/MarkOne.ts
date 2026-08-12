import { Component, MixinAfter } from "@qloom/runtime";
import type { MarkupWriter } from "@qloom/core";

/** Test mixin: appends "1" to the host element's data-seq (proves attach + order). */
@MixinAfter
export class MarkOne extends Component {
  beginRender(writer: MarkupWriter): void {
    const el = writer.currentElement();
    if (el) el.setAttribute("data-seq", (el.getAttribute("data-seq") ?? "") + "1");
  }
}
