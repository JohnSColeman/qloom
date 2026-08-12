import { Component, Parameter, MixinAfter } from "@qloom/runtime";
import type { MarkupWriter } from "@qloom/core";
import { ConfirmClick } from "./ConfirmClick.js";

/**
 * Tapestry: `Confirm` — a mixin that gates the host control's action behind a
 * confirmation. `@MixinAfter`, so its `beginRender` runs after the host has
 * opened its element and writes the `data-confirm-*` attributes onto it. The
 * client gate ([ConfirmClick]) reads those attributes and asks before letting
 * the host's click through.
 *
 * `message`/`title` default when unbound; bind `t:message`/`t:title` to override
 * (use a `literal:` prefix for free text — the compiler's literal-param fast path
 * doesn't cover mixin parameters yet).
 */
@MixinAfter
export class Confirm extends Component {
  @Parameter() message = "Are you sure?";
  @Parameter() title = "Confirm";

  beginRender(writer: MarkupWriter): void {
    ConfirmClick.install();
    writer.attribute("data-confirm-message", this.message);
    writer.attribute("data-confirm-title", this.title);
  }
}
