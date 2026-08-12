import { Component } from "@qloom/runtime";
import type { MarkupWriter } from "@qloom/core";

/** A trivial embedded component with a callable method, used to prove
 *  @InjectComponent resolves the child instance (its greet() is invoked from
 *  the host page's event handler). */
export class Marker extends Component {
  beginRender(writer: MarkupWriter): void {
    writer.element("span");
    writer.attribute("class", "marker");
    writer.text("marker");
  }

  afterRender(writer: MarkupWriter): void {
    writer.end();
  }

  greet(): string {
    return "resolved";
  }
}
