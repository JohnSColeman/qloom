import { Field } from "./Field.js";
import type { MarkupWriter } from "@qloom/core";

/** Tapestry: `KaptchaField` (tapestry-kaptcha). The text input the user types the
 *  challenge into — two-way-binds like a `TextField` (its `t:id` property). The
 *  async verification happens in the form's submit handler (see the Signup port),
 *  since field validation is synchronous. */
export class KaptchaField extends Field {
  override beginRender(writer: MarkupWriter): void {
    super.beginRender(writer, "text");
  }
}
