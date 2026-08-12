import { Component } from "@qloom/runtime";
import { applyInformals } from "@qloom/core";
import type { MarkupWriter } from "@qloom/core";

/**
 * Tapestry: `LinkSubmit` — a client-side hyperlink that submits the enclosing
 * form. On click it dispatches a submit event on the nearest `<form>`, which the
 * Form component's handler catches (pull → validate → PRG).
 */
export class LinkSubmit extends Component {
  beginRender(writer: MarkupWriter): void {
    writer.element("a");
    applyInformals(writer, this);
    const el = writer.currentElement();
    if (el) {
      if (!el.getAttribute("href")) el.setAttribute("href", "#");
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const form = el.closest("form");
        form?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      });
    }
  }
  afterRender(writer: MarkupWriter): void {
    writer.end();
  }
}
