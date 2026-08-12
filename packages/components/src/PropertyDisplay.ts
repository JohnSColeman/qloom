import { Component, Parameter } from "@qloom/runtime";
import type { MarkupWriter } from "@qloom/core";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tapestry: `PropertyDisplay` — outputs a single property value of a bean (used
 * by BeanDisplay). Reads `object[property]` and writes it as text.
 */
export class PropertyDisplay extends Component {
  @Parameter() object: any;
  @Parameter() property = "";

  beginRender(writer: MarkupWriter): boolean {
    const val = this.object?.[this.property];
    writer.text(val == null ? "" : String(val));
    return false;
  }
}
