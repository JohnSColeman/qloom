import { Component } from "@qloom/runtime";
import { applyInformals } from "@qloom/core";
import type { MarkupWriter } from "@qloom/core";

/**
 * Tapestry: `DevTool` — a small menu of dev-time options. Qloom renders a
 * container with a "Reload page" action (session invalidation is server-only).
 */
export class DevTool extends Component {
  beginRender(writer: MarkupWriter): boolean {
    writer.element("div");
    applyInformals(writer, this);
    writer.attribute("class", "devtool");
    writer.element("button");
    writer.attribute("type", "button");
    writer.attribute("class", "devtool-reload");
    writer.text("Reload page");
    const reloadBtn = writer.currentElement();
    writer.end();
    if (reloadBtn) reloadBtn.addEventListener("click", () => location.reload());
    return false; // no template body
  }
  afterRender(writer: MarkupWriter): void {
    writer.end();
  }
}
