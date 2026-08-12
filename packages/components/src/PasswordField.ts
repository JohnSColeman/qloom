import { Field } from "./Field.js";
import type { MarkupWriter } from "@qloom/core";

/** Tapestry: `PasswordField`. */
export class PasswordField extends Field {
  override beginRender(writer: MarkupWriter): void {
    super.beginRender(writer, "password");
  }
}
