import type { MarkupWriter } from "@qloom/core";
import { CurrentForm } from "./CurrentForm.js";
import { humanize } from "./humanize.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Shared field rendering for BeanEditor/BeanEditForm: one labelled text field
 *  per included property, registered with the enclosing form context. */
export function renderBeanFields(writer: MarkupWriter, obj: any, props: readonly string[]): void {
  for (const prop of props) {
    writer.element("div");
    writer.element("label");
    writer.text(humanize(prop));
    writer.end();
    writer.element("input");
    writer.attribute("type", "text");
    writer.attribute("name", prop);
    const cur = obj?.[prop];
    if (cur != null && cur !== "") writer.attribute("value", String(cur));
    const input = writer.currentElement() as HTMLInputElement | null;
    writer.end(); // </input>
    writer.end(); // </div>
    if (input) {
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
  }
}
