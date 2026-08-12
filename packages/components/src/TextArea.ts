import { Component } from "@qloom/runtime";
import { applyInformals, BINDINGS, COMPONENT_ID } from "@qloom/core";
import type { MarkupWriter } from "@qloom/core";
import { fieldTarget } from "./fieldTarget.js";
import { humanize } from "./humanize.js";
import { decorateField } from "./decorateField.js";
import { Validators } from "@qloom/validation";
import { CurrentForm } from "./CurrentForm.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tapestry: `TextArea` — renders a `<textarea>` for multi-line text. Like a
 * Field it two-way binds `value` (or the `t:id` property) and validates, but the
 * value is the element's text content rather than a `value` attribute.
 */
export class TextArea extends Component {
  beginRender(writer: MarkupWriter): boolean {
    const target = fieldTarget(this);
    const id = (this as any)[COMPONENT_ID] as string | undefined;
    const spec = ((this as any)[BINDINGS]?.validate?.get() as string) ?? "";
    const composite = Validators.build(spec);
    writer.element("textarea");
    applyInformals(writer, this);
    if (id) writer.attribute("name", id);
    const current = target.get();
    if (current != null && current !== "") writer.text(String(current));
    const area = writer.currentElement() as HTMLTextAreaElement | null;
    if (area) {
      const label = humanize(id ?? "field");
      const deco = decorateField(area);
      const reg = {
        id: id ?? "field",
        label,
        required: composite.required,
        pull: () => target.set?.(area.value),
        validate: () => composite.validate(area.value, id ?? "field", label),
        mark: (m: string | null) => deco.mark(m),
        focus: () => area.focus(),
      };
      area.addEventListener("blur", () => reg.mark(reg.validate()));
      CurrentForm.get()?.fields.push(reg);
    }
    return false; // no template body
  }
  afterRender(writer: MarkupWriter): void {
    writer.end();
  }
}
