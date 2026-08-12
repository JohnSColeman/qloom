import { Component, Parameter } from "@qloom/runtime";
import { BINDINGS } from "@qloom/core";
import type { MarkupWriter, RenderBody } from "@qloom/core";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Conditionally renders its body (the "then"). When the test fails and a
 * `<p:else>` block is supplied, that renders instead. Tapestry: `If` extends
 * `AbstractConditional`.
 */
export class If extends Component {
  @Parameter({ required: true }) test!: boolean;
  @Parameter() negate = false;

  beginRender(writer: MarkupWriter): boolean {
    if (this.test !== this.negate) return true; // render the body (the "then")
    const elseBlock = (this as any)[BINDINGS]?.["else"]?.get?.();
    if (typeof elseBlock === "function") (elseBlock as RenderBody)(writer);
    return false; // skip the body
  }
}
