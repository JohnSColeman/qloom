import { Component, Parameter } from "@qloom/runtime";
import type { MarkupWriter } from "@qloom/core";

/**
 * Tapestry: `TextOutput` — outputs paragraph-oriented text: the value is split
 * into lines and each line is emitted inside its own `<p>` element.
 */
export class TextOutput extends Component {
  @Parameter() value = "";

  beginRender(writer: MarkupWriter): boolean {
    for (const line of String(this.value ?? "").split("\n")) {
      writer.element("p");
      writer.text(line);
      writer.end();
    }
    return false;
  }
}
