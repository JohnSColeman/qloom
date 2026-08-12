import { Component } from "@qloom/runtime";
import { applyInformals } from "@qloom/core";
import type { MarkupWriter } from "@qloom/core";
import { AjaxLoopState } from "./AjaxLoopState.js";

/**
 * Tapestry: `RemoveRowLink` — inside an AjaxFormLoop body, removes its row on click.
 */
export class RemoveRowLink extends Component {
  beginRender(writer: MarkupWriter): void {
    const row = AjaxLoopState.getRow();
    writer.element("a");
    applyInformals(writer, this);
    const el = writer.currentElement();
    if (el) {
      if (!el.getAttribute("href")) el.setAttribute("href", "#");
      if (row) {
        const { loop } = row;
        // Resolve the row index at click time from the live DOM, not from a
        // render-time capture — the keyed reconciler may reuse this row's node
        // across a middle removal, which would make a captured index stale.
        el.addEventListener("click", (e) => {
          e.preventDefault();
          loop.removeRowByNode(el);
        });
      }
    }
  }
  afterRender(writer: MarkupWriter): void {
    writer.end();
  }
}
