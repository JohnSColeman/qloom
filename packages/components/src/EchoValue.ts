import { Component, BindParameter, InjectContainer } from "@qloom/runtime";
import { COMPONENT_ID } from "@qloom/core";
import type { MarkupWriter } from "@qloom/core";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tapestry app1 test mixin `EchoValue` — the canonical `@BindParameter` demo.
 * `@BindParameter value` two-way-binds to the host field's `value`: it reads the
 * bound property (echoed in a `_before` div), overwrites it during the host's
 * render (proving the write reaches the host), then restores it in `afterRender`
 * (echoed in a `_after` div). Not `@MixinAfter`, so it wraps the host — its
 * `_before` div precedes the field and its `_after` div follows it.
 */
export class EchoValue extends Component {
  @BindParameter() value: any;
  @InjectContainer private host: any;
  private temp: any;

  beginRender(writer: MarkupWriter): void {
    writer.element("div");
    writer.attribute("id", `${this.host?.[COMPONENT_ID] ?? "field"}_before`);
    writer.text(`${this.value}-before`);
    writer.end();
    this.temp = this.value;
    this.value = "temporaryvaluefromechovaluemixin";
  }

  afterRender(writer: MarkupWriter): void {
    this.value = this.temp;
    writer.element("div");
    writer.attribute("id", `${this.host?.[COMPONENT_ID] ?? "field"}_after`);
    writer.text(`${this.value}-after`);
    writer.end();
  }
}
