import { Component } from "@qloom/runtime";
import { applyInformals, BINDINGS, Messages } from "@qloom/core";
import type { MarkupWriter } from "@qloom/core";
import { humanize } from "./humanize.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tapestry: `Label`. Renders `<label>` — with a `for` attribute pointing at the
 * named field — plus its body. When bodyless (`<t:label for="smoke"/>`), it uses
 * the field's own label: the `<fieldId>-label` message catalogue entry (as
 * Tapestry does), falling back to the humanised field id when no entry exists.
 */
export class Label extends Component {
  private el: Element | null = null;
  private forId = "";

  beginRender(writer: MarkupWriter): void {
    writer.element("label");
    applyInformals(writer, this);
    const forId = (this as any)[BINDINGS]?.["for"]?.get?.() as string | undefined;
    this.forId = forId ?? "";
    if (forId) writer.attribute("for", forId);
    this.el = writer.currentElement();
  }
  afterRender(writer: MarkupWriter): void {
    if (this.el && this.el.childNodes.length === 0 && this.forId) {
      const key = `${this.forId}-label`;
      const msg = Messages.message(key);
      writer.text(msg !== key ? msg : humanize(this.forId));
    }
    writer.end();
  }
}
