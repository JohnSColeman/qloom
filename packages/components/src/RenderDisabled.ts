import { Component, MixinAfter, InjectContainer } from "@qloom/runtime";
import type { MarkupWriter } from "@qloom/core";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tapestry: `RenderDisabled` — the mixin that renders `disabled` on the host
 * field when it is disabled. `@MixinAfter` (so it writes onto the element the
 * host already opened); `@InjectContainer` hands it the host field, whose
 * `disabled` it reads. Faithful to `corelib/mixins/RenderDisabled`.
 */
@MixinAfter
export class RenderDisabled extends Component {
  @InjectContainer private host: any;

  beginRender(writer: MarkupWriter): void {
    if (this.host?.disabled) writer.attribute("disabled", "disabled");
  }
}
