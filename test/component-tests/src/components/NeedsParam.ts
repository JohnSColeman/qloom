import { Component, Parameter } from "@qloom/runtime";
import type { MarkupWriter } from "@qloom/core";

/** Declares a required parameter, so leaving it unbound must throw at render. */
export class NeedsParam extends Component {
  @Parameter({ required: true }) label!: string;

  beginRender(writer: MarkupWriter): void {
    writer.element("span");
    writer.text(this.label);
  }

  afterRender(writer: MarkupWriter): void {
    writer.end();
  }
}
