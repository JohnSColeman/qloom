import { Component, Parameter } from "@qloom/runtime";
import { applyInformals, COMPONENT_ID } from "@qloom/core";
import type { MarkupWriter } from "@qloom/core";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tapestry: `FormFragment` — a portion of a Form that may be selectively
 * displayed. Renders a wrapper `<div>` around its body; when `visible` is false
 * the wrapper is hidden (the content is still rendered so it can be toggled).
 *
 * The wrapper carries a `data-form-fragment` marker so the enclosing `Form`
 * can exclude the fields of a *hidden* fragment from submit-time validation —
 * Tapestry's rule (a hidden fragment is not processed on submit). The check is
 * made at submit time against the live DOM, so revealing the fragment before
 * submit re-includes its fields.
 */
export class FormFragment extends Component {
  @Parameter() visible = true;

  beginRender(writer: MarkupWriter): boolean {
    writer.element("div");
    applyInformals(writer, this);
    // FormFragment is a ClientElement: render its t:id so a mixin (TriggerFragment)
    // or client code can address it.
    const id = (this as any)[COMPONENT_ID] as string | undefined;
    if (id) writer.attribute("id", id);
    writer.attribute("data-form-fragment", "");
    if (!this.visible) writer.attribute("style", "display:none");
    return true; // render the body
  }
  afterRender(writer: MarkupWriter): void {
    writer.end();
  }
}
