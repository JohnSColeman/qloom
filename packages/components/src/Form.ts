import { Component } from "@qloom/runtime";
import { applyInformals, triggerEvent, Navigation, Zones, BINDINGS } from "@qloom/core";
import type { MarkupWriter } from "@qloom/core";
import { FormContext } from "./FormContext.js";
import { CurrentForm } from "./CurrentForm.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tapestry: `Form`. On submit it pulls every field's value back to its binding
 * (two-way), validates, and — if clean — fires the `submit` event; the handler's
 * return value drives navigation (PRG). Invalid fields (or `recordError` from the
 * handler) refresh the error displays in place, without disturbing the inputs.
 */
export class Form extends Component {
  private ctx = new FormContext();
  private saved: FormContext | null = null;
  private formEl: Element | null = null;
  private focused = false;
  private submitting = false;

  beginRender(writer: MarkupWriter): void {
    writer.element("form");
    applyInformals(writer, this);
    this.formEl = writer.currentElement();
    // NOTE: the form is deliberately NOT markForReplace'd. Wholesale-replacing
    // the <form> on a zone refresh would discard focus/caret/uncommitted input
    // in every field. Reconciling in place keeps the element (so its submit
    // listener persists) and reuses the field nodes the ctx already references —
    // so focus and input survive a refresh. (A refresh that changes the field
    // *structure* won't re-register fields; the submit uses the initial set.)
    this.ctx = new FormContext();
    this.saved = CurrentForm.get(); // restore the enclosing form (if nested) in cleanupRender
    CurrentForm.set(this.ctx);
    const self = this;
    this.formEl?.addEventListener("submit", (e) => {
      e.preventDefault();
      // Tapestry SubmitMode: a cancel/unconditional Submit bypasses client-side
      // validation. The clicked control is the SubmitEvent's `submitter`; its
      // `data-submit-mode` (rendered by Submit) selects the behaviour.
      const submitter = (e as SubmitEvent).submitter as HTMLElement | null;
      const mode = submitter?.getAttribute("data-submit-mode") ?? "normal";
      void self.handleSubmit(mode === "cancel" || mode === "unconditional");
    });
    // Keep the focused field focused when the pointer goes down on a submit
    // control. Otherwise mousedown blurs it, its blur-validation inserts error
    // decoration that reflows the page, and the submit control moves out from
    // under the pointer before mouseup — cancelling the click, so the form never
    // submits (only the blurred field ends up flagged). Suppressing the focus
    // shift (as the error popup's ✕ close does) lets the click land; handleSubmit
    // then pulls + validates every field. See tests/ClickShift.spec.ts.
    this.formEl?.addEventListener("mousedown", (e) => {
      if (isSubmitControl(e.target)) e.preventDefault();
    });
  }

  afterRender(writer: MarkupWriter): void {
    if (!this.focused && this.ctx.fields.length) {
      this.focused = true;
      this.ctx.fields[0]?.focus();
    }
    writer.end();
  }

  /** Always runs (driveInstance's finally), even if the body threw — so
   *  CurrentForm is restored to the enclosing form rather than stranded. */
  cleanupRender(): void {
    CurrentForm.set(this.saved);
  }

  /** Control names inside a currently-hidden `FormFragment` (a `<div
   *  data-form-fragment>` not laid out — `offsetParent === null` means it, or an
   *  ancestor fragment, has `display:none`). Matched to a field by its `name`,
   *  which Qloom renders equal to the field's `t:id` (== FieldReg.id). */
  private hiddenFragmentFieldNames(): Set<string> {
    const names = new Set<string>();
    const root = this.formEl;
    if (!root) return names;
    for (const frag of root.querySelectorAll("[data-form-fragment]")) {
      if ((frag as HTMLElement).offsetParent === null) {
        for (const el of frag.querySelectorAll("[name]")) {
          const n = el.getAttribute("name");
          if (n) names.add(n);
        }
      }
    }
    return names;
  }

  /** @param bypassValidation a cancel/unconditional Submit skips all client-side
   *  validation (field rules and the cross-field `validate` event) — Tapestry's
   *  SubmitMode.CANCEL / UNCONDITIONAL. Values are still pulled so the submit
   *  handler sees them. */
  private async handleSubmit(bypassValidation = false): Promise<void> {
    // Double-submit guard. A rapid double-click (or a re-dispatched LinkSubmit)
    // fires two submit events; the second must not run a second submission. The
    // two events are separate macrotasks with a microtask drain between them, so
    // resetting synchronously (or in a `finally`) would clear the flag before the
    // second event — we reset on a *macrotask* (setTimeout 0) instead, which the
    // already-queued second submit runs ahead of. A later, deliberate resubmit
    // still works once the timer clears the flag.
    if (this.submitting) return;
    this.submitting = true;
    try {
      await this.runSubmit(bypassValidation);
    } finally {
      setTimeout(() => { this.submitting = false; }, 0);
    }
  }

  private async runSubmit(bypassValidation: boolean): Promise<void> {
    const ctx = this.ctx;
    ctx.errors = [];
    // Tapestry: fields inside a *hidden* FormFragment are excluded from submit
    // processing. Detected against the live DOM at submit time (by the field's
    // control name), so a fragment revealed before submit re-includes its fields.
    const hidden = this.hiddenFragmentFieldNames();
    const excluded = (f: { id?: string }): boolean => f.id != null && hidden.has(f.id);
    for (const f of ctx.fields) if (!excluded(f)) f.pull();
    if (!bypassValidation) {
      for (const f of ctx.fields) {
        if (excluded(f)) continue;
        const err = f.validate();
        f.mark(err);
        if (err) ctx.recordError(err, f.id);
      }

      try {
        const crossField = await triggerEvent(this, "validate", ctx);
        if (typeof crossField === "string" && crossField) ctx.recordError(crossField);
      } catch (err) {
        ctx.recordError(err instanceof Error ? err.message : String(err));
      }
    }

    if (!ctx.getHasErrors()) {
      try {
        const result = await triggerEvent(this, "submit", ctx);
        const zone = (this as any)[BINDINGS]?.zone?.get?.() as string | undefined;
        if (zone && !ctx.getHasErrors()) {
          Zones.refreshZone(zone);
          return;
        }
        if (!ctx.getHasErrors()) {
          if (typeof result === "string" && !isRouteLike(result)) ctx.recordError(result);
          else if (result != null) {
            Navigation.navigate(result);
            return;
          }
        }
      } catch (err) {
        ctx.recordError(err instanceof Error ? err.message : String(err));
      }
    }

    // Blocked: focus the first invalid field (its popup shows), refresh the summary
    // (unassociated errors only — field errors are shown as popups).
    if (ctx.getHasErrors()) {
      ctx.fields.find((f) => ctx.inError(f.id))?.focus();
      for (const d of ctx.displays) d.refresh(ctx.unassociated());
    }
  }
}

/** A returned string that is a page name/route (no spaces) triggers navigation;
 *  a message-like string is treated as a recorded error. */
function isRouteLike(s: string): boolean {
  return /^[A-Za-z][\w-]*$/.test(s);
}

/** Is the event target a form submit control (or inside one, e.g. a `<button>`'s
 *  inner `<span>`)? A `<button>` with no `type` submits by default. */
function isSubmitControl(target: EventTarget | null): boolean {
  const el = target instanceof Element ? target.closest("button, input") : null;
  if (!el) return false;
  const type = el.getAttribute("type")?.toLowerCase() ?? null;
  // A <button> defaults to type=submit when the attribute is absent.
  if (el.tagName === "BUTTON") return type === null || type === "submit";
  return type === "submit";
}
