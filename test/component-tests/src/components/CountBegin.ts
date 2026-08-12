import { Component } from "@qloom/runtime";
import type { MarkupWriter } from "@qloom/core";

/** Host that writes one <span class="rep"> per beginRender pass. A mixin driving
 *  the afterRender loop makes it render multiple times. */
export class CountBegin extends Component {
  private n = 0;
  beginRender(writer: MarkupWriter): void {
    this.n++;
    writer.element("span");
    writer.attribute("class", "rep");
    writer.text(String(this.n));
    writer.end();
  }
}
