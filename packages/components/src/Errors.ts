import { Component, Parameter } from "@qloom/runtime";
import { Zones } from "@qloom/core";
import type { MarkupWriter } from "@qloom/core";
import { CurrentForm } from "./CurrentForm.js";
import type { FormError } from "./types.js";

/** Tapestry: `Errors`. Renders the form's recorded errors; refreshes in place
 *  when the Form validates (registers with the enclosing form). */
export class Errors extends Component {
  /** Tapestry's Errors `banner` parameter — the header shown above the list.
   *  Default matches core's `private-default-banner` message; unbound, this
   *  initialiser acts as the default (Qloom @Parameter semantics). */
  @Parameter()
  banner = "You must correct the following errors before continuing.";

  private el: Element | null = null;

  beginRender(writer: MarkupWriter): void {
    writer.element("div");
    // Tapestry's Errors class (pre-5.4 / classic) — the app stylesheet targets
    // `DIV.t-error` (container), `DIV.t-error DIV` (the red banner) and
    // `DIV.t-error UL LI` (the list). The container is always rendered (unlike
    // Tapestry, which omits it when empty) so it stays a stable target for the
    // in-place Zone patch when the Form later records errors.
    writer.attribute("class", "t-error");
    this.el = writer.currentElement();
    const banner = this.banner;
    const errors = CurrentForm.get()?.unassociated() ?? [];
    if (this.el) {
      const self = this;
      CurrentForm.get()?.displays.push({
        refresh: (errs) => {
          if (self.el) Zones.patch(self.el, (w) => Errors.renderErrors(w, errs, banner));
        },
      });
    }
    Errors.renderErrors(writer, errors, banner);
  }

  afterRender(writer: MarkupWriter): void {
    writer.end();
  }

  private static renderErrors(
    writer: MarkupWriter,
    errors: readonly FormError[],
    banner: string,
  ): void {
    if (errors.length === 0) return; // nothing when clean (Tapestry omits banner + list)
    // The inner `<div class="t-banner">` is the red header box — the app
    // stylesheet paints `DIV.t-error DIV` red; without it the summary is an
    // unstyled bare list (the discrepancy this renders faithfully).
    writer.element("div");
    writer.attribute("class", "t-banner");
    writer.text(banner);
    writer.end();
    writer.element("ul");
    for (const err of errors) {
      writer.element("li");
      writer.text(err.message);
      writer.end();
    }
    writer.end();
  }
}
