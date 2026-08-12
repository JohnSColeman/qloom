import { Component, Parameter } from "@qloom/runtime";
import { applyInformals } from "@qloom/core";
import type { MarkupWriter } from "@qloom/core";

/**
 * Tapestry: `Dynamic` — renders content supplied by an external template. Qloom's
 * browser analogue takes the template markup via its `template` parameter and
 * writes it into the host element (so it can vary at different times).
 */
export class Dynamic extends Component {
  @Parameter() template = "";

  beginRender(writer: MarkupWriter): boolean {
    writer.element("div");
    applyInformals(writer, this);
    writer.raw(String(this.template ?? ""));
    return false; // no template body
  }
  afterRender(writer: MarkupWriter): void {
    writer.end();
  }
}
