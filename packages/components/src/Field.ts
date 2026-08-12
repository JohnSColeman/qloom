import { Component, Parameter, Mixin } from "@qloom/runtime";
import { applyInformals, BINDINGS, CONTAINER, COMPONENT_ID, VALIDATE_SPEC } from "@qloom/core";
import type { MarkupWriter } from "@qloom/core";
import { Validators } from "@qloom/validation";
import { fieldTarget } from "./fieldTarget.js";
import { humanize } from "./humanize.js";
import { decorateField } from "./decorateField.js";
import { CurrentForm } from "./CurrentForm.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Base for input-backed fields: renders one `<input>`, two-way binds `value`,
 *  discovers its `@Validate` spec, validates on blur, and registers with the form. */
@Mixin("renderdisabled")
export abstract class Field extends Component {
  /** Tapestry `AbstractField.disabled`. Storage/binding only — the `disabled`
   *  attribute is rendered by the `RenderDisabled` mixin, which every field carries
   *  as an implementation mixin (`@Mixin` on this base, matching Tapestry's
   *  `AbstractField`) and which reads this via `@InjectContainer`. */
  @Parameter() disabled = false;

  beginRender(writer: MarkupWriter, type: string): void {
    const target = fieldTarget(this);
    const id = (this as any)[COMPONENT_ID] as string | undefined;
    const spec = Field.resolveSpec(this, id);
    writer.element("input");
    applyInformals(writer, this);
    writer.attribute("type", type);
    if (id) writer.attribute("name", id);
    const current = target.get();
    if (current != null && current !== "") writer.attribute("value", String(current));
    const input = writer.currentElement() as HTMLInputElement | null;
    if (input) {
      const composite = Validators.build(spec);
      const label = humanize(id ?? "field");
      const deco = decorateField(input);
      // Capture the enclosing loop row (if any) at render time. On submit the
      // field re-establishes its row before writing, so a field inside a loop
      // writes to its own item rather than whichever row the loop last left set.
      const rowRestore = CurrentForm.get()?.rowContext ?? null;
      const reg = {
        ...(id !== undefined ? { id } : {}),
        label,
        required: composite.required,
        pull: () => {
          rowRestore?.();
          target.set?.(input.value);
        },
        validate: () => composite.validate(input.value, id ?? "", label),
        mark: (m: string | null) => deco.mark(m),
        focus: () => input.focus(),
      };
      input.addEventListener("blur", () => reg.mark(reg.validate()));
      CurrentForm.get()?.fields.push(reg);
    }
  }

  afterRender(writer: MarkupWriter): void {
    writer.end();
  }

  /** Explicit `t:validate` binding, else the container's `@Validate` for the
   *  property named by the field's `t:id` (Tapestry's implicit convention).
   *  Both sources are built the same way — an unknown validator throws
   *  (`Validators.build`), whichever it came from. */
  private static resolveSpec(field: any, id: string | undefined): string {
    // M1 discovers @Validate by the field's t:id (Tapestry's implicit field→property
    // convention). A field with an explicit `value=` binding to a differently-named
    // property is not yet supported — deferred (needs the compiler to emit the
    // bound-property name).
    const explicit = field[BINDINGS]?.validate?.get?.() as string | undefined;
    if (typeof explicit === "string" && explicit) return explicit;
    const fromAnnotation = field[CONTAINER]?.[VALIDATE_SPEC]?.[id ?? ""];
    return typeof fromAnnotation === "string" ? fromAnnotation : "";
  }
}
