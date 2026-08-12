import { Component, Parameter } from "@qloom/runtime";
import type { MarkupWriter } from "@qloom/core";

/**
 * Tapestry: `OutputRaw` — writes unfiltered markup to the client (unlike a normal
 * expansion, special characters/entities are left exactly as is).
 */
export class OutputRaw extends Component {
  @Parameter() value = "";

  beginRender(writer: MarkupWriter): boolean {
    writer.raw(String(this.value ?? ""));
    return false;
  }
}
