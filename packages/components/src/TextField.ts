import { Field } from "./Field.js";
import type { MarkupWriter } from "@qloom/core";

/** Tapestry: `TextField` — two-way `value` binding (or the `t:id` property). */
export class TextField extends Field {
  override beginRender(writer: MarkupWriter): void {
    super.beginRender(writer, "text");
  }
}
