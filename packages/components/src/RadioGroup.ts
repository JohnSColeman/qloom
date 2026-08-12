import { Component } from "@qloom/runtime";
import { COMPONENT_ID } from "@qloom/core";
import { fieldTarget } from "./fieldTarget.js";
import { humanize } from "./humanize.js";
import { CurrentForm } from "./CurrentForm.js";
import { RadioGroupState } from "./RadioGroupState.js";
import type { RadioGroupContext } from "./types.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tapestry: `RadioGroup`. A *transparent* container (renders no element of its
 * own) that establishes the shared input `name` and two-way `value` binding for
 * the `Radio`s in its body. Registers one field with the form: on submit it
 * pulls whichever radio is checked back into the binding.
 */
export class RadioGroup extends Component {
  private saved: RadioGroupContext | null = null;

  beginRender(): void {
    const target = fieldTarget(this);
    const id = (this as any)[COMPONENT_ID] as string | undefined;
    const ctx: RadioGroupContext = { name: id ?? "radiogroup", target, radios: [] };
    this.saved = RadioGroupState.get();
    RadioGroupState.set(ctx);
    CurrentForm.get()?.fields.push({
      ...(id !== undefined ? { id } : {}),
      label: humanize(id ?? "radiogroup"),
      required: false,
      pull: () => {
        const checked = ctx.radios.find((r) => r.checked);
        if (checked) target.set?.(checked.value);
      },
      validate: () => null,
      mark: () => {},
      focus: () => ctx.radios[0]?.focus(),
    });
  }

  afterRender(): void {
    RadioGroupState.set(this.saved);
    this.saved = null;
  }
}
