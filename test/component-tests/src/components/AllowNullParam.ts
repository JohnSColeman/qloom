import { Component, Parameter } from "@qloom/runtime";
import type { MarkupWriter } from "@qloom/core";

/**
 * Exercises `@Parameter({ allowNull: false })`: reading `strict` when it is bound
 * to null must throw (fail-loud). `lax` (no option) defaults to allowNull=true,
 * so a null binding reads through without error.
 */
export class AllowNullParam extends Component {
  @Parameter({ allowNull: false }) strict!: string;
  @Parameter() lax!: string | null;

  beginRender(writer: MarkupWriter): void {
    writer.element("span");
    writer.attribute("class", "an");
    writer.text(`${this.strict}/${this.lax ?? "∅"}`);
  }
  afterRender(writer: MarkupWriter): void {
    writer.end();
  }
}
