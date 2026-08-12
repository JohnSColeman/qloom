import { Component } from "@qloom/runtime";
import { applyInformals, BINDINGS } from "@qloom/core";
import type { MarkupWriter } from "@qloom/core";
import { RadioGroupState } from "./RadioGroupState.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tapestry: `Radio`. Renders `<input type="radio">` sharing its `RadioGroup`'s
 * `name`, carrying its own `value`, and checked when that value equals the
 * group's bound value.
 */
export class Radio extends Component {
  beginRender(writer: MarkupWriter): void {
    const group = RadioGroupState.get();
    const myValue = String((this as any)[BINDINGS]?.value?.get?.() ?? "");
    writer.element("input");
    applyInformals(writer, this);
    writer.attribute("type", "radio");
    if (group) writer.attribute("name", group.name);
    writer.attribute("value", myValue);
    if (group && String(group.target.get() ?? "") === myValue) {
      writer.attribute("checked", "checked");
    }
    const el = writer.currentElement() as HTMLInputElement | null;
    if (el && group) group.radios.push(el);
  }
  afterRender(writer: MarkupWriter): void {
    writer.end();
  }
}
