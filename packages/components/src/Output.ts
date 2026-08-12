import { Component, Parameter } from "@qloom/runtime";
import type { MarkupWriter } from "@qloom/core";

/**
 * Tapestry: `Output` — writes its (formatted) `value` as text. Qloom renders the
 * formatted value; number/date formatting via `format` is not yet modelled.
 */
export class Output extends Component {
  @Parameter() value: unknown;

  beginRender(writer: MarkupWriter): boolean {
    writer.text(this.value == null ? "" : String(this.value));
    return false;
  }
}
