import { Component } from "@qloom/runtime";
import { applyInformals, BINDINGS } from "@qloom/core";
import type { MarkupWriter } from "@qloom/core";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Tapestry: `Submit`. A submit button that triggers its form's submit. The
 *  `mode` param (SubmitMode: normal/cancel/unconditional) is rendered as
 *  `data-submit-mode`; `Form` reads it off the clicked submitter to decide
 *  whether to run client-side validation (cancel/unconditional bypass it). */
export class Submit extends Component {
  beginRender(writer: MarkupWriter): boolean {
    writer.element("input");
    applyInformals(writer, this);
    writer.attribute("type", "submit");
    const mode = String((this as any)[BINDINGS]?.mode?.get?.() ?? "normal").toLowerCase();
    writer.attribute("data-submit-mode", mode);
    // Label priority: a formal `t:value` binding, else the informal `value`
    // attribute already applied (e.g. value="Search"), else Tapestry's default.
    const bound = (this as any)[BINDINGS]?.value?.get?.();
    const label = bound != null ? String(bound) : (writer.currentElement()?.getAttribute("value") ?? "Submit");
    writer.attribute("value", label);
    return false;
  }
  afterRender(writer: MarkupWriter): void {
    writer.end();
  }
}
