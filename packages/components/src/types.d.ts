/** Types for @qloom/components — the built-in component library. */
import type { Binding } from "@qloom/core";

/** A field registered with the enclosing form during render. */
export interface FieldReg {
  id?: string;
  label: string;
  required: boolean;
  pull(): void;
  validate(): string | null;
  mark(message: string | null): void;
  focus(): void;
}

/** A recorded form error, associated with the originating field where known
 *  (custom, form-level errors carry no `field`). */
export interface FormError {
  field?: string;
  message: string;
}

/** An error display registered with the enclosing form. */
export interface ErrorDisplay {
  refresh(errors: readonly FormError[]): void;
}

/** The shared state a `RadioGroup` establishes for its enclosing `Radio`s:
 *  the input `name`, the two-way `value` target, and the live radio elements. */
export interface RadioGroupContext {
  name: string;
  target: Binding;
  radios: HTMLInputElement[];
}

/** The add/remove-row surface an AjaxFormLoop exposes to its link components. */
export interface AjaxRowController {
  addRow(): void;
  removeRow(index: number): void;
  /** Remove the row that currently contains `node`, resolving its index from the
   *  live DOM at click time — robust to the keyed reconciler reusing row nodes
   *  (a render-time captured index would go stale). */
  removeRowByNode(node: Node): void;
}

/** A captcha challenge: an opaque id and an image (data-URI or URL). The answer
 *  lives server-side and is never part of this. */
export interface CaptchaChallenge {
  id: string;
  image: string;
}

/** How `KaptchaImage` obtains a fresh challenge — supplied by the app (which
 *  owns the API), keeping @qloom/components free of any API dependency. */
export interface CaptchaProvider {
  newChallenge(): Promise<CaptchaChallenge>;
}

/** Tapestry `Severity` — an alert's level. Its lower-case name is the CSS class
 *  suffix (`alert-info` / `alert-warn` / `alert-error`), per Tapestry. */
export type Severity = "info" | "warn" | "error";

/** Tapestry `Alert` — one message shown by the `Alerts` component. `markup`
 *  renders the message as raw HTML (Tapestry's markup alert); otherwise it is
 *  escaped text. */
export interface Alert {
  id?: string;
  severity: Severity;
  message: string;
  markup?: boolean;
}

/** Tapestry: `OptionModel` — one `<option>`'s label + value. */
export interface OptionModel {
  label: string;
  value: string | number;
}
