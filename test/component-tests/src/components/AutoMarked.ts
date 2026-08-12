import { Component, Mixin } from "@qloom/runtime";
import type { MarkupWriter } from "@qloom/core";

/** @Mixin auto-attaches markone with NO t:mixins in the template. */
@Mixin("markone")
export class AutoMarked extends Component {
  beginRender(writer: MarkupWriter): void {
    writer.element("div");
    writer.attribute("id", "auto-marked");
  }
  afterRender(writer: MarkupWriter): void {
    writer.end();
  }
}
