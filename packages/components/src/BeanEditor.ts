import { Component, Parameter } from "@qloom/runtime";
import type { MarkupWriter } from "@qloom/core";
import { renderBeanFields } from "./renderBeanFields.js";
import { beanProps } from "./beanProps.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tapestry: `BeanEditor` — generates the editing UI (a field per bean property)
 * for its `object`. Must be enclosed by a Form (registers fields with it).
 */
export class BeanEditor extends Component {
  @Parameter() object: any;
  @Parameter() include = "";

  beginRender(writer: MarkupWriter): boolean {
    renderBeanFields(writer, this.object, beanProps(this.include, this.object));
    return false; // no template body
  }
}
