import { Component, Parameter } from "@qloom/runtime";
import { BINDINGS } from "@qloom/core";
import type { MarkupWriter, RenderBody } from "@qloom/core";
import { CurrentForm } from "./CurrentForm.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Loops over `source`, rendering its body once per item with `value` (and
 * `index`) bound. Iteration is driven by the phase protocol: `afterRender`
 * returns `false` to re-run from `beginRender` until the source is exhausted.
 *
 * Tapestry extras: `element` (a literal element name) wraps each iteration's
 * body in that element; `empty` (a `<p:empty>` block) renders instead of the
 * loop when the source is null/empty (default: render nothing).
 */
export class Loop<T> extends Component {
  @Parameter({ required: true }) source!: Iterable<T>;
  @Parameter() value!: T;
  @Parameter() index = 0;

  private iterator!: Iterator<T>;
  private current!: IteratorResult<T>;
  private wrapEl: string | undefined = undefined;
  private savedRowContext: (() => void) | null = null;

  setupRender(writer: MarkupWriter): boolean {
    // A null/undefined source renders nothing rather than throwing — Tapestry's
    // TAP5-205 null-source handling (the source is often unset until bound).
    this.iterator = (this.source ?? ([] as Iterable<T>))[Symbol.iterator]();
    this.current = this.iterator.next();
    this.index = 0;
    // Read the literal `element` name once per render (constant across passes).
    const el = (this as any)[BINDINGS]?.element?.get?.();
    this.wrapEl = el ? String(el) : undefined;
    // Save the enclosing form's row context (for nested loops); restored in cleanupRender.
    this.savedRowContext = CurrentForm.get()?.rowContext ?? null;
    if (this.current.done) {
      // Empty/null source → render the `<p:empty>` block if one was supplied.
      const emptyBlock = (this as any)[BINDINGS]?.empty?.get?.();
      if (typeof emptyBlock === "function") (emptyBlock as RenderBody)(writer);
      return false; // no content
    }
    return true;
  }

  beginRender(writer: MarkupWriter): void {
    this.value = this.current.value; // set current before the body renders
    // Inside a form, record how to re-establish THIS row's value on submit, so
    // each row's fields round-trip to their own item (Tapestry's loop-in-form,
    // volatile-style, over the live source). Captured per-row by each field.
    const form = CurrentForm.get();
    if (form) {
      const row = this.current.value;
      const vb = (this as any)[BINDINGS]?.value;
      form.rowContext = () => {
        if (vb?.set) vb.set(row);
        else this.value = row;
      };
    }
    if (this.wrapEl) writer.element(this.wrapEl); // wrap this iteration's body
  }

  afterRender(writer: MarkupWriter): boolean | null {
    if (this.wrapEl) writer.end(); // close the per-iteration wrapper element
    this.current = this.iterator.next();
    this.index++;
    return this.current.done ? null : false; // false → loop back to beginRender
  }

  /** Restore the enclosing form's row context after the loop finishes — so a
   *  nested loop, or fields rendered after the loop, aren't left with a stale
   *  per-row restore. Runs once (the loop's final phase pass). */
  cleanupRender(): void {
    const form = CurrentForm.get();
    if (form) form.rowContext = this.savedRowContext;
  }
}
