import { Component } from "@qloom/runtime";
import { applyInformals, COMPONENT_ID } from "@qloom/core";
import type { MarkupWriter } from "@qloom/core";
import { fieldTarget } from "./fieldTarget.js";
import { humanize } from "./humanize.js";
import { CurrentForm } from "./CurrentForm.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tapestry: `Checkbox` — renders an `<input type="checkbox">` and two-way binds a
 * boolean via the element's `checked` state (not its value attribute).
 */
export class Checkbox extends Component {
  beginRender(writer: MarkupWriter): boolean {
    const target = fieldTarget(this);
    const id = (this as any)[COMPONENT_ID] as string | undefined;
    writer.element("input");
    applyInformals(writer, this);
    writer.attribute("type", "checkbox");
    if (id) writer.attribute("name", id);
    const input = writer.currentElement() as HTMLInputElement | null;
    if (input) {
      input.checked = !!target.get();
      CurrentForm.get()?.fields.push({
        ...(id !== undefined ? { id } : {}),
        label: humanize(id ?? "field"),
        required: false,
        pull: () => target.set?.(input.checked),
        validate: () => null,
        mark: () => {},
        focus: () => input.focus(),
      });
    }
    return false; // no template body
  }
  afterRender(writer: MarkupWriter): void {
    writer.end();
  }
}
