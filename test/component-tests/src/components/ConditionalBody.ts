import { Component } from "@qloom/runtime";
import { COMPONENT_ID } from "@qloom/core";
import type { MarkupWriter } from "@qloom/core";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Host whose own beforeRenderBody returns false (skip the body). A mixin
 *  returning true from beforeRenderBody should override that (first boolean wins). */
export class ConditionalBody extends Component {
  beginRender(writer: MarkupWriter): void {
    writer.element("div");
    const id = (this as any)[COMPONENT_ID] as string | undefined;
    if (id) writer.attribute("id", id);
  }
  beforeRenderBody(): boolean {
    return false; // skip the body unless a mixin overrides
  }
  afterRender(writer: MarkupWriter): void {
    writer.end();
  }
}
