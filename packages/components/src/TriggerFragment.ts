import { Component, Parameter, MixinAfter } from "@qloom/runtime";
import type { MarkupWriter } from "@qloom/core";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tapestry `TriggerFragment` — a mixin on a form control (checkbox/radio/select)
 * that shows or hides a `FormFragment` as the control changes. `fragment` names
 * the FormFragment's `t:id` (Tapestry's `defaultPrefix=COMPONENT`); `invert`
 * flips the sense (checked ⇒ hidden). Hiding the fragment (`display:none`) also
 * drops its fields from the enclosing `Form`'s submit, which checks the live DOM
 * — so this gives conditional form sections with no extra plumbing.
 *
 * `@MixinAfter` so `afterRender` runs while the host's element is still open:
 * that element (the control) is captured from the writer and its `change` event
 * wired directly. Qloom deletes Tapestry's `t5/core/form-fragment` client module
 * and its `@HeartbeatDeferred` forward-reference dance — the fragment (declared
 * later in the template) is resolved from the DOM lazily, at event time.
 */
@MixinAfter
export class TriggerFragment extends Component {
  /** The FormFragment's `t:id` to toggle. */
  @Parameter() fragment = "";
  /** Invert the sense: checked/truthy hides the fragment instead of showing it. */
  @Parameter() invert = false;

  afterRender(writer: MarkupWriter): void {
    const input = writer.currentElement() as HTMLInputElement | null;
    const fragmentId = this.fragment;
    if (!input || !fragmentId) return;
    const invert = this.invert;

    const apply = (): void => {
      const fragment = document.getElementById(fragmentId) as HTMLElement | null;
      if (!fragment) return;
      const on =
        input.type === "checkbox" || input.type === "radio" ? input.checked : Boolean(input.value);
      fragment.style.display = (invert ? !on : on) ? "" : "none";
    };

    input.addEventListener("change", apply);
    // Sync the fragment to the control's initial state once this render pass has
    // committed and the (later-declared) fragment is in the DOM.
    setTimeout(apply, 0);
  }
}
