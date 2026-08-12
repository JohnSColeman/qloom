import { Component } from "@qloom/runtime";
import { triggerEvent } from "@qloom/core";
import { CurrentForm } from "./CurrentForm.js";

/**
 * Tapestry: `SubmitNotifier` — a non-visual component that notifies its container
 * during form submission. Registers a form hook that triggers a `notify` event on
 * the container when the form pulls its fields (renders no markup).
 */
export class SubmitNotifier extends Component {
  beginRender(): boolean {
    const self = this;
    CurrentForm.get()?.fields.push({
      label: "",
      required: false,
      pull: () => {
        triggerEvent(self, "notify", undefined);
      },
      validate: () => null,
      mark: () => {},
      focus: () => {},
    });
    return false; // non-visual
  }
}
