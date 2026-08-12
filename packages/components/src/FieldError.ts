import { Component } from "@qloom/runtime";
import { applyInformals, Zones, BINDINGS } from "@qloom/core";
import type { MarkupWriter } from "@qloom/core";
import { CurrentForm } from "./CurrentForm.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tapestry: `Error` — presents the validation error of a single field (its `for`
 * parameter). Registered as `error`; named `FieldError` to avoid shadowing the
 * global `Error`. Filters the form's recorded errors by the field-id prefix.
 */
export class FieldError extends Component {
  private el: Element | null = null;

  beginRender(writer: MarkupWriter): boolean {
    const forId = ((this as any)[BINDINGS]?.["for"]?.get?.() as string) ?? "";
    writer.element("span");
    writer.attribute("class", "error");
    applyInformals(writer, this);
    this.el = writer.currentElement();
    if (this.el) {
      const self = this;
      CurrentForm.get()?.displays.push({
        refresh: (errs) => {
          if (!self.el) return;
          const mine = errs.filter((e) => e.field === forId);
          Zones.patch(self.el, (w) => {
            for (const m of mine) w.text(m.message);
          });
        },
      });
    }
    return false; // no template body
  }
  afterRender(writer: MarkupWriter): void {
    writer.end();
  }
}
