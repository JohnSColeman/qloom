import {
  Component,
  SetupRender,
  BeginRender,
  BeforeRenderTemplate,
  BeforeRenderBody,
  AfterRenderBody,
  AfterRenderTemplate,
  AfterRender,
  CleanupRender,
} from "@qloom/runtime";
import { CONTAINER } from "@qloom/core";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Records the order its render phases fire into the container page's `order`
 *  array. Method names differ from the phase names, so the decorators (not the
 *  convention fallback) are what map them — including the two new template
 *  phases. */
export class PhaseRec extends Component {
  private log(name: string): void {
    const page = (this as any)[CONTAINER];
    (page.order ?? (page.order = [])).push(name);
  }

  @SetupRender setup(): void {
    this.log("setup");
  }
  @BeginRender begin(): void {
    this.log("begin");
  }
  @BeforeRenderTemplate beforeTemplate(): void {
    this.log("beforeTemplate");
  }
  @BeforeRenderBody beforeBody(): void {
    this.log("beforeBody");
  }
  @AfterRenderBody afterBody(): void {
    this.log("afterBody");
  }
  @AfterRenderTemplate afterTemplate(): void {
    this.log("afterTemplate");
  }
  @AfterRender after(): void {
    this.log("afterRender");
  }
  @CleanupRender cleanup(): void {
    this.log("cleanup");
  }
}
