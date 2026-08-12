import { Component, Parameter } from "@qloom/runtime";
import { applyInformals } from "@qloom/core";
import type { MarkupWriter } from "@qloom/core";

/**
 * Tapestry: `FontAwesomeIcon` — renders an `<i>` tag with the CSS classes that
 * select a FontAwesome icon (`fa fa-<icon>`), plus any informal parameters.
 */
export class FontAwesomeIcon extends Component {
  @Parameter() icon = "";

  beginRender(writer: MarkupWriter): boolean {
    writer.element("i");
    applyInformals(writer, this);
    writer.attribute("class", `fa fa-${this.icon}`);
    return false;
  }
  afterRender(writer: MarkupWriter): void {
    writer.end();
  }
}
