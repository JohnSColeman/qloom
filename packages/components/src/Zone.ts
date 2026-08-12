import { Component, Parameter } from "@qloom/runtime";
import { applyInformals, Zones, COMPONENT_ID, CHILD_BODY } from "@qloom/core";
import type { MarkupWriter, RenderBody } from "@qloom/core";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * A re-renderable region. Renders a wrapper element (default `<div>`) with its
 * `t:id`, and registers itself so events can patch it in place via the
 * reconciler. Tapestry: `Zone`.
 */
export class Zone extends Component {
  @Parameter() elementName = "div";

  beginRender(writer: MarkupWriter): void {
    const zoneId = (this as any)[COMPONENT_ID] as string | undefined;
    writer.element(this.elementName);
    applyInformals(writer, this);
    if (zoneId) writer.attribute("id", zoneId);
    const el = writer.currentElement();
    const childBody = (this as any)[CHILD_BODY] as RenderBody | undefined;
    if (zoneId && el && childBody) Zones.registerZone(zoneId, el, childBody);
  }

  afterRender(writer: MarkupWriter): void {
    writer.end();
  }
}
