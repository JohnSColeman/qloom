import { Component, Parameter } from "@qloom/runtime";
import type { MarkupWriter } from "@qloom/core";

/**
 * Exercises `@Parameter({ defaultPrefix })`: `mode` defaults to literal (a bare
 * value is the raw string), `label` defaults to prop (a bare value is a property
 * expression on the container). Renders `mode/label`.
 */
export class PrefixThing extends Component {
  @Parameter({ defaultPrefix: "literal" }) mode!: string;
  @Parameter() label!: string; // defaultPrefix defaults to prop

  beginRender(writer: MarkupWriter): void {
    writer.element("span");
    writer.attribute("class", "pt");
    writer.text(`${this.mode}/${this.label}`);
  }
  afterRender(writer: MarkupWriter): void {
    writer.end();
  }
}
