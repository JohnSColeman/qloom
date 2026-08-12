import { Field } from "./Field.js";
import type { MarkupWriter } from "@qloom/core";

/**
 * Tapestry: `Hidden` — records a page property as a value into the form via an
 * `<input type="hidden">`. Two-way binds and round-trips exactly like a Field.
 */
export class Hidden extends Field {
  override beginRender(writer: MarkupWriter): void {
    super.beginRender(writer, "hidden");
  }
}
