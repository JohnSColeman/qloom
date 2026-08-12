import { Field } from "./Field.js";
import type { MarkupWriter } from "@qloom/core";

/**
 * Tapestry: `DateField`. Tapestry renders a text input with a JS datepicker and
 * a `format` parameter; the faithful browser analogue is a native
 * `<input type="date">`, which two-way-binds `value` (or the `t:id` property)
 * exactly like `TextField`.
 */
export class DateField extends Field {
  override beginRender(writer: MarkupWriter): void {
    super.beginRender(writer, "date");
  }
}
