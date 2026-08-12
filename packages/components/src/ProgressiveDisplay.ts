import { Component } from "@qloom/runtime";
import { applyInformals, Zones, CHILD_BODY } from "@qloom/core";
import type { MarkupWriter, RenderBody } from "@qloom/core";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tapestry: `ProgressiveDisplay` — renders simplified initial content
 * ("loading …") and then reveals its true body via a deferred update (the
 * browser-only analogue of Tapestry's Ajax second request).
 */
export class ProgressiveDisplay extends Component {
  beginRender(writer: MarkupWriter): boolean {
    writer.element("div");
    applyInformals(writer, this);
    writer.text("loading …");
    const container = writer.currentElement();
    const body = (this as any)[CHILD_BODY] as RenderBody | undefined;
    if (container && body) {
      setTimeout(() => Zones.patch(container, (w) => body(w)), 0);
    }
    return false; // body is rendered later, not inline
  }
  afterRender(writer: MarkupWriter): void {
    writer.end();
  }
}
