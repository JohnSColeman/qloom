import { Page } from "@qloom/runtime";

/**
 * tapestry: Form/LinkSubmit double-submit guard. The submit handler increments a
 * counter (on `window` and in the DOM) instead of navigating, so a spec can
 * count how many submissions a rapid double-click actually produces — exactly
 * one with the guard in place.
 */
export class DoubleSubmitDemo extends Page {
  onSubmitFromForm(): void {
    const w = window as unknown as { __submitCount?: number };
    w.__submitCount = (w.__submitCount ?? 0) + 1;
    const el = document.getElementById("count");
    if (el) el.textContent = String(w.__submitCount);
  }
}
