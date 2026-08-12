import { Component, Parameter } from "@qloom/runtime";
import type { MarkupWriter } from "@qloom/core";

/**
 * Exercises `@Parameter({ value })` — a default *binding expression* used when
 * the parameter is unbound: `message:` (catalogue lookup), `literal:` (raw
 * string), and a bare expression (prop path on the container). Renders
 * `label|note|derived`.
 */
export class DefaultValueThing extends Component {
  @Parameter({ value: "message:demo.label" }) label!: string;
  @Parameter({ value: "literal:fallback" }) note!: string;
  @Parameter({ value: "greeting" }) derived!: string; // bare → defaultPrefix prop

  beginRender(writer: MarkupWriter): void {
    writer.element("span");
    writer.attribute("class", "dv");
    writer.text(`${this.label}|${this.note}|${this.derived}`);
  }
  afterRender(writer: MarkupWriter): void {
    writer.end();
  }
}
