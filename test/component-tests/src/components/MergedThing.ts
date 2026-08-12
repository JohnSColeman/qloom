import { Component, Mixin } from "@qloom/runtime";
import type { MarkupWriter } from "@qloom/core";

/** Class mixin (markone) merges with a template t:mixins (marktwo). */
@Mixin("markone")
export class MergedThing extends Component {
  beginRender(writer: MarkupWriter): void {
    writer.element("div");
    writer.attribute("id", "merged");
  }
  afterRender(writer: MarkupWriter): void {
    writer.end();
  }
}
