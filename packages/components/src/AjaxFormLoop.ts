import { Component } from "@qloom/runtime";
import { applyInformals, Zones, BINDINGS, CHILD_BODY } from "@qloom/core";
import type { MarkupWriter, RenderBody, Binding } from "@qloom/core";
import type { AjaxRowController } from "./types.js";
import { AjaxLoopState } from "./AjaxLoopState.js";
import { CurrentForm } from "./CurrentForm.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tapestry: `AjaxFormLoop` — a Loop with client-side add/remove of rows. Renders
 * a container, iterates `source` rendering the body per item (binding `value`),
 * and re-renders in place when a row is added or removed.
 *
 * Each row's root element is stamped with a stable `data-key` (unless the body
 * already supplies a `data-key`/`id`), assigned when the row is created and kept
 * across add/remove. This makes the focus-preserving reconciler match rows **by
 * key**, so removing (or inserting) a *middle* row keeps every surviving row's
 * node — its focus and uncontrolled input value follow the item, not the index.
 */
export class AjaxFormLoop extends Component implements AjaxRowController {
  private containerEl: HTMLElement | null = null;
  private source: any[] = [];
  private valueBinding: Binding | undefined = undefined;
  private body: RenderBody | undefined = undefined;
  private keys: string[] = [];
  private keySeq = 0;

  beginRender(writer: MarkupWriter): boolean {
    this.source = ((this as any)[BINDINGS]?.source?.get() as any[]) ?? [];
    this.valueBinding = (this as any)[BINDINGS]?.value as Binding | undefined;
    this.body = (this as any)[CHILD_BODY] as RenderBody | undefined;
    // (Re)align the stable per-row keys to the current source, reusing any key
    // already assigned so a full re-render doesn't reshuffle row identities.
    if (this.keys.length !== this.source.length) {
      this.keys = this.source.map((_, i) => this.keys[i] ?? this.nextKey());
    }
    writer.element("div");
    applyInformals(writer, this);
    this.containerEl = writer.currentElement() as HTMLElement | null;
    AjaxLoopState.setLoop(this);
    this.renderRows(writer);
    return false; // rows rendered explicitly, no inline body
  }
  afterRender(writer: MarkupWriter): void {
    writer.end();
  }

  private nextKey(): string {
    return `afl-${this.keySeq++}`;
  }

  private renderRows(writer: MarkupWriter): void {
    // The row parent: the live container (initial render) or the reconciler's
    // scratch node (a rerender) — either way, the writer's current element.
    const parent = writer.currentElement();
    // Inside a form (initial render), record how to re-establish each row on
    // submit so its fields round-trip to their own item; restored after the loop.
    // On a rerender there's no enclosing form render, so form is null (no-op).
    const form = CurrentForm.get();
    const savedRowContext = form?.rowContext ?? null;
    for (let i = 0; i < this.source.length; i++) {
      this.valueBinding?.set?.(this.source[i]);
      if (form && this.valueBinding?.set) {
        const row = this.source[i];
        form.rowContext = () => this.valueBinding!.set!(row);
      }
      AjaxLoopState.setRow({ loop: this, index: i });
      const before = parent ? parent.childNodes.length : 0;
      this.body?.(writer);
      // Stamp this row's root element with its stable key (an author-supplied
      // data-key/id on the row wins).
      if (parent) {
        for (let n = before; n < parent.childNodes.length; n++) {
          const node = parent.childNodes[n];
          if (node && node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;
            if (!el.getAttribute("data-key") && !el.getAttribute("id")) {
              el.setAttribute("data-key", this.keys[i] ?? this.nextKey());
            }
            break; // key only the row's first (root) element
          }
        }
      }
      AjaxLoopState.setRow(null);
    }
    if (form) form.rowContext = savedRowContext;
  }

  private rerender(): void {
    if (this.containerEl) Zones.patch(this.containerEl, (w) => this.renderRows(w));
  }
  addRow(): void {
    this.source.push("");
    this.keys.push(this.nextKey());
    this.rerender();
  }
  removeRow(index: number): void {
    if (index < 0 || index >= this.source.length) return;
    this.source.splice(index, 1);
    this.keys.splice(index, 1);
    this.rerender();
  }

  /** Resolve the row index from the live DOM (the container's element child that
   *  contains `node`), then remove it. Robust to the keyed reconciler reusing a
   *  row node — a render-time captured index would be stale after a middle removal. */
  removeRowByNode(node: Node): void {
    const container = this.containerEl;
    if (!container) return;
    let row: Node | null = node;
    while (row && row.parentNode !== container) row = row.parentNode;
    if (!(row instanceof Element)) return;
    const index = Array.prototype.indexOf.call(container.children, row);
    if (index >= 0) this.removeRow(index);
  }
}
