import { Component, Parameter } from "@qloom/runtime";
import { applyInformals } from "@qloom/core";
import type { MarkupWriter } from "@qloom/core";
import { humanize } from "./humanize.js";
import { CurrentForm } from "./CurrentForm.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tapestry: `PropertyEditor` — edits a single property of a bean (used primarily
 * by BeanEditForm). Renders a text field named by the property, seeded with the
 * current value, and two-way binds `object[property]` on submit.
 */
export class PropertyEditor extends Component {
  @Parameter() object: any;
  @Parameter() property = "";

  beginRender(writer: MarkupWriter): boolean {
    const prop = this.property;
    writer.element("input");
    applyInformals(writer, this);
    writer.attribute("type", "text");
    writer.attribute("name", prop);
    const cur = this.object?.[prop];
    if (cur != null && cur !== "") writer.attribute("value", String(cur));
    const input = writer.currentElement() as HTMLInputElement | null;
    if (input) {
      const obj = this.object;
      CurrentForm.get()?.fields.push({
        id: prop,
        label: humanize(prop),
        required: false,
        pull: () => {
          if (obj) obj[prop] = input.value;
        },
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
