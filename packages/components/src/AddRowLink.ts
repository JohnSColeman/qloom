import { Component } from "@qloom/runtime";
import { applyInformals } from "@qloom/core";
import type { MarkupWriter } from "@qloom/core";
import { AjaxLoopState } from "./AjaxLoopState.js";

/**
 * Tapestry: `AddRowLink` — inside/beside an AjaxFormLoop, adds a new row on click.
 */
export class AddRowLink extends Component {
  beginRender(writer: MarkupWriter): void {
    const loop = AjaxLoopState.getLoop();
    writer.element("a");
    applyInformals(writer, this);
    const el = writer.currentElement();
    if (el) {
      if (!el.getAttribute("href")) el.setAttribute("href", "#");
      el.addEventListener("click", (e) => {
        e.preventDefault();
        loop?.addRow();
      });
    }
  }
  afterRender(writer: MarkupWriter): void {
    writer.end();
  }
}
