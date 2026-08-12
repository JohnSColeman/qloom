import { Component } from "@qloom/runtime";
import { applyInformals } from "@qloom/core";
import type { MarkupWriter } from "@qloom/core";

/** Tapestry: `AjaxLoader` — a placeholder for the in-flight loading indicator. */
export class AjaxLoader extends Component {
  beginRender(writer: MarkupWriter): boolean {
    writer.element("span");
    applyInformals(writer, this);
    writer.attribute("class", "ajax-loader");
    return false;
  }
  afterRender(writer: MarkupWriter): void {
    writer.end();
  }
}
