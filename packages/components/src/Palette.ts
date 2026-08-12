import { Component } from "@qloom/runtime";
import { BINDINGS, COMPONENT_ID } from "@qloom/core";
import type { MarkupWriter, Binding } from "@qloom/core";
import { humanize } from "./humanize.js";
import { CurrentForm } from "./CurrentForm.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tapestry: `Palette` — a multiple-selection component: an "available" list box
 * (options not yet chosen) and a "selected" list box, two-way binding the
 * `selected` collection. Options move between the lists via the select/deselect
 * buttons or by double-clicking an option. In normal mode the selected list is
 * kept in the model's natural order (and options reinsert into their proper
 * available position); with `reorder="true"`, moved options append to the bottom
 * and up/down buttons reorder the selection.
 */
export class Palette extends Component {
  beginRender(writer: MarkupWriter): boolean {
    const id = (this as any)[COMPONENT_ID] as string | undefined;
    const target = (this as any)[BINDINGS]?.selected as Binding<string[]> | undefined;
    const rawModel = (this as any)[BINDINGS]?.model?.get();
    const order = Array.isArray(rawModel)
      ? rawModel.map(String)
      : String(rawModel ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    const reorder = (this as any)[BINDINGS]?.reorder?.get?.() === true;
    const selected = (target?.get() as string[] | undefined) ?? [];
    const selSet = new Set(selected);
    const available = order.filter((o) => !selSet.has(o));

    writer.element("div");
    writer.attribute("class", "t-palette");
    const availableEl = Palette.renderList(
      writer,
      available,
      id ? `${id}-available` : undefined,
      "t-palette-available",
    );

    // The controls column: select (→), deselect (←), and — in reorder mode —
    // up/down. Buttons are type="button" so they never submit the enclosing form.
    writer.element("div");
    writer.attribute("class", "t-palette-controls");
    const selectBtn = Palette.button(writer, "t-palette-select", "→", "Select");
    const deselectBtn = Palette.button(writer, "t-palette-deselect", "←", "Deselect");
    const upBtn = reorder ? Palette.button(writer, "t-palette-up", "↑", "Move up") : null;
    const downBtn = reorder ? Palette.button(writer, "t-palette-down", "↓", "Move down") : null;
    writer.end(); // controls

    const selectedEl = Palette.renderList(writer, selected, id, "t-palette-selected");
    writer.end(); // t-palette

    if (availableEl && selectedEl) {
      Palette.wire(availableEl, selectedEl, order, reorder, selectBtn, deselectBtn, upBtn, downBtn);
    }

    if (selectedEl) {
      CurrentForm.get()?.fields.push({
        ...(id !== undefined ? { id } : {}),
        label: humanize(id ?? "field"),
        required: false,
        pull: () => target?.set?.(Array.from(selectedEl.options).map((o) => o.value)),
        validate: () => null,
        mark: () => {},
        focus: () => selectedEl.focus(),
      });
    }
    return false; // no template body
  }

  private static renderList(
    writer: MarkupWriter,
    opts: readonly string[],
    name: string | undefined,
    cssClass: string,
  ): HTMLSelectElement | null {
    writer.element("select");
    writer.attribute("multiple", "multiple");
    writer.attribute("class", cssClass);
    if (name) writer.attribute("name", name);
    const el = writer.currentElement() as HTMLSelectElement | null;
    for (const o of opts) {
      writer.element("option");
      writer.attribute("value", o);
      writer.text(o);
      writer.end();
    }
    writer.end();
    return el;
  }

  private static button(
    writer: MarkupWriter,
    cssClass: string,
    label: string,
    title: string,
  ): HTMLButtonElement | null {
    writer.element("button");
    writer.attribute("type", "button"); // never submit the enclosing form
    writer.attribute("class", cssClass);
    writer.attribute("title", title);
    const el = writer.currentElement() as HTMLButtonElement | null;
    writer.text(label);
    writer.end();
    return el;
  }

  /** Attach the client-side move behaviour to the two lists and the buttons. */
  private static wire(
    available: HTMLSelectElement,
    selected: HTMLSelectElement,
    order: readonly string[],
    reorder: boolean,
    selectBtn: HTMLButtonElement | null,
    deselectBtn: HTMLButtonElement | null,
    upBtn: HTMLButtonElement | null,
    downBtn: HTMLButtonElement | null,
  ): void {
    const moveRight = (): void => {
      Palette.moveSelectedOptions(available, selected);
      if (!reorder) Palette.sortByModel(selected, order); // normal mode: model order
    };
    const moveLeft = (): void => {
      Palette.moveSelectedOptions(selected, available);
      Palette.sortByModel(available, order); // available is always in model order
    };
    selectBtn?.addEventListener("click", moveRight);
    deselectBtn?.addEventListener("click", moveLeft);
    available.addEventListener("dblclick", moveRight);
    selected.addEventListener("dblclick", moveLeft);
    upBtn?.addEventListener("click", () => Palette.reorderSelection(selected, -1));
    downBtn?.addEventListener("click", () => Palette.reorderSelection(selected, 1));
  }

  /** Move the highlighted `<option>`s from `src` into `dst` (appended). */
  private static moveSelectedOptions(src: HTMLSelectElement, dst: HTMLSelectElement): void {
    for (const opt of Array.from(src.selectedOptions)) {
      opt.selected = false;
      dst.appendChild(opt); // appendChild moves the node out of src
    }
  }

  /** Reorder `sel` so its `<option>`s follow `order` (the model order). */
  private static sortByModel(sel: HTMLSelectElement, order: readonly string[]): void {
    const opts = Array.from(sel.options);
    opts.sort((a, b) => order.indexOf(a.value) - order.indexOf(b.value));
    for (const o of opts) sel.appendChild(o); // re-append in sorted order
  }

  /** Move the highlighted options one place up (-1) or down (+1) within `sel`. */
  private static reorderSelection(sel: HTMLSelectElement, dir: -1 | 1): void {
    const opts = Array.from(sel.options);
    if (dir === -1) {
      for (let i = 1; i < opts.length; i++) {
        if (opts[i]!.selected && !opts[i - 1]!.selected) sel.insertBefore(opts[i]!, opts[i - 1]!);
      }
    } else {
      for (let i = opts.length - 2; i >= 0; i--) {
        if (opts[i]!.selected && !opts[i + 1]!.selected) sel.insertBefore(opts[i + 1]!, opts[i]!);
      }
    }
  }
}
