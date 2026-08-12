import { Component } from "@qloom/runtime";
import { BINDINGS, COMPONENT_ID } from "@qloom/core";
import type { MarkupWriter, Binding } from "@qloom/core";
import { humanize } from "./humanize.js";
import { CurrentForm } from "./CurrentForm.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tapestry: `Checklist` — a vertical list of checkboxes over a `model`, two-way
 * binding the `selected` collection of checked values.
 */
export class Checklist extends Component {
  beginRender(writer: MarkupWriter): boolean {
    const id = (this as any)[COMPONENT_ID] as string | undefined;
    const target = (this as any)[BINDINGS]?.selected as Binding<string[]> | undefined;
    const rawModel = (this as any)[BINDINGS]?.model?.get();
    const options = Array.isArray(rawModel)
      ? rawModel.map(String)
      : String(rawModel ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    const selected = new Set((target?.get() as string[] | undefined) ?? []);
    const inputs: HTMLInputElement[] = [];
    for (const opt of options) {
      writer.element("label");
      writer.element("input");
      writer.attribute("type", "checkbox");
      if (id) writer.attribute("name", id);
      writer.attribute("value", opt);
      const input = writer.currentElement() as HTMLInputElement | null;
      if (input) {
        input.checked = selected.has(opt);
        inputs.push(input);
      }
      writer.end(); // </input>
      writer.text(` ${opt}`);
      writer.end(); // </label>
    }
    CurrentForm.get()?.fields.push({
      ...(id !== undefined ? { id } : {}),
      label: humanize(id ?? "field"),
      required: false,
      pull: () => target?.set?.(inputs.filter((i) => i.checked).map((i) => i.value)),
      validate: () => null,
      mark: () => {},
      focus: () => inputs[0]?.focus(),
    });
    return false; // no template body
  }
}
