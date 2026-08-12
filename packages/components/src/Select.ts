import { Component } from "@qloom/runtime";
import { applyInformals, BINDINGS, COMPONENT_ID, CONTAINER } from "@qloom/core";
import type { MarkupWriter } from "@qloom/core";
import { fieldTarget } from "./fieldTarget.js";
import { humanize } from "./humanize.js";
import { CurrentForm } from "./CurrentForm.js";
import { SelectModel } from "./SelectModel.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tapestry: `Select`. Renders `<option>`s from `model` — a `SelectModel`, an
 * array of `{label, value}`/strings, or a comma-separated string like
 * `literal:5,10,15,20` — and two-way-binds `value` (or the `t:id` property),
 * marking the current value selected.
 */
export class Select extends Component {
  beginRender(writer: MarkupWriter): void {
    const target = fieldTarget(this);
    const id = (this as any)[COMPONENT_ID] as string | undefined;
    // The bound `model`, else — when absent (Tapestry infers it from the bound
    // enum type, which we can't) — a `<id>Model` property on the container.
    let rawModel = (this as any)[BINDINGS]?.model?.get();
    if (rawModel == null && id) rawModel = (this as any)[CONTAINER]?.[`${id}Model`];
    const options = Select.normalizeModel(rawModel);

    writer.element("select");
    applyInformals(writer, this);
    if (id) writer.attribute("name", id);
    const selectEl = writer.currentElement() as HTMLSelectElement | null;
    const current = String(target.get() ?? "");
    // Tapestry: an optional leading blank option (value always "", never marked
    // selected). blankOption is ALWAYS / NEVER / AUTO (default). blankLabel is
    // its (default empty) text.
    if (Select.showBlankOption(this)) {
      const blankLabel = String((this as any)[BINDINGS]?.blankLabel?.get?.() ?? "");
      writer.element("option");
      writer.attribute("value", "");
      if (blankLabel) writer.text(blankLabel);
      writer.end();
    }
    for (const opt of options) {
      writer.element("option");
      writer.attribute("value", opt.value);
      if (opt.value === current) writer.attribute("selected", "selected");
      writer.text(opt.label);
      writer.end();
    }
    if (selectEl) {
      CurrentForm.get()?.fields.push({
        ...(id !== undefined ? { id } : {}),
        label: humanize(id ?? "field"),
        required: false,
        pull: () => target.set?.(selectEl.value),
        validate: () => null,
        mark: () => {},
        focus: () => selectEl.focus(),
      });
    }
  }

  /** Tapestry `Select.showBlankOption()`: ALWAYS → true, NEVER → false.
   *
   *  Tapestry's AUTO shows the blank when the field is *not required*, where
   *  required-ness flows largely from entity bean validation (`@NotNull`).
   *  Qloom does not port tapestry-beanvalidator (a recorded divergence — see
   *  BACKLOG), so it cannot tell an optional enum select from a required one and
   *  would fabricate a blank where real Tapestry omits one — breaking output
   *  fidelity (the reference app's `roomPreference`/`creditCardType` selects are
   *  required and render no blank). So AUTO (the default) conservatively omits
   *  the blank; authors opt in explicitly with `blankOption="always"`. */
  private static showBlankOption(field: any): boolean {
    const mode = String(field[BINDINGS]?.blankOption?.get?.() ?? "auto").toLowerCase();
    return mode === "always";
  }

  /** Accept a `SelectModel` (via `getOptions()`), an array of strings or
   *  `{label, value}` (OptionModel), or a comma-separated string; normalise to
   *  `{label, value}` strings. */
  private static normalizeModel(raw: unknown): Array<{ label: string; value: string }> {
    if (raw instanceof SelectModel) {
      return raw.getOptions().map((o) => ({ label: String(o.label), value: String(o.value) }));
    }
    if (Array.isArray(raw)) {
      return raw.map((o) =>
        o !== null && typeof o === "object" && "value" in o
          ? { label: String((o as any).label ?? (o as any).value), value: String((o as any).value) }
          : { label: String(o), value: String(o) },
      );
    }
    return String(raw ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => ({ label: s, value: s }));
  }

  afterRender(writer: MarkupWriter): void {
    writer.end();
  }
}
