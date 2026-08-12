import { Component, Parameter } from "@qloom/runtime";
import { applyInformals, triggerEvent, Navigation } from "@qloom/core";
import type { MarkupWriter } from "@qloom/core";
import { FormContext } from "./FormContext.js";
import { CurrentForm } from "./CurrentForm.js";
import { renderBeanFields } from "./renderBeanFields.js";
import { beanProps } from "./beanProps.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tapestry: `BeanEditForm` — an entire form for editing a bean: a field per
 * property (via BeanEditor's rendering) plus a submit control. Fires `submit`
 * on its container after pulling the edited values.
 */
export class BeanEditForm extends Component {
  @Parameter() object: any;
  @Parameter() include = "";
  private ctx = new FormContext();
  private saved: FormContext | null = null;

  beginRender(writer: MarkupWriter): boolean {
    writer.element("form");
    applyInformals(writer, this);
    const formEl = writer.currentElement();
    // Not markForReplace'd — see Form: reconciling in place preserves field
    // focus/input across a zone refresh while keeping the submit listener.
    this.ctx = new FormContext();
    this.saved = CurrentForm.get();
    CurrentForm.set(this.ctx);

    renderBeanFields(writer, this.object, beanProps(this.include, this.object));

    writer.element("input");
    writer.attribute("type", "submit");
    writer.attribute("value", "Save");
    writer.end();

    const self = this;
    formEl?.addEventListener("submit", (e) => {
      e.preventDefault();
      for (const f of self.ctx.fields) f.pull();
      const result = triggerEvent(self, "submit", self.ctx);
      if (result != null) Navigation.navigate(result);
    });
    return false; // no template body
  }
  afterRender(writer: MarkupWriter): void {
    writer.end();
  }

  /** Restore the enclosing form; runs even if rendering threw (driveInstance's
   *  finally), so CurrentForm is never stranded. */
  cleanupRender(): void {
    CurrentForm.set(this.saved);
  }
}
