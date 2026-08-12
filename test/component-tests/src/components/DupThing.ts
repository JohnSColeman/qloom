import { Component, Mixin } from "@qloom/runtime";
import type { MarkupWriter } from "@qloom/core";

/** Declares markone; the template also attaches markone via t:mixins → the same
 *  mixin twice → a fail-loud duplicate-mixin error at render. */
@Mixin("markone")
export class DupThing extends Component {
  beginRender(writer: MarkupWriter): void {
    writer.element("div");
    writer.attribute("id", "dup");
  }
  afterRender(writer: MarkupWriter): void {
    writer.end();
  }
}
