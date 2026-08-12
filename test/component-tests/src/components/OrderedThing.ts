import { Component, Mixin } from "@qloom/runtime";
import type { MarkupWriter } from "@qloom/core";

/** Ordering constraint: marktwo runs before markone despite markone being
 *  declared first, so data-seq is "21", not "12". */
@Mixin("marktwo", { order: ["before:markone"] })
@Mixin("markone")
export class OrderedThing extends Component {
  beginRender(writer: MarkupWriter): void {
    writer.element("div");
    writer.attribute("id", "ordered");
  }
  afterRender(writer: MarkupWriter): void {
    writer.end();
  }
}
