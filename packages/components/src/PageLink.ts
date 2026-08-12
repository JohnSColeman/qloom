import { Component, Parameter } from "@qloom/runtime";
import { applyInformals, Navigation, Zones } from "@qloom/core";
import type { MarkupWriter } from "@qloom/core";

/** A link that navigates to another page (SPA — no reload). Tapestry: `PageLink`. */
export class PageLink extends Component {
  @Parameter() page!: string;
  @Parameter() context?: unknown;

  beginRender(writer: MarkupWriter): void {
    const page = this.page;
    const ctx = this.context == null ? [] : Array.isArray(this.context) ? this.context : [this.context];
    writer.element("a");
    applyInformals(writer, this);
    writer.attribute("href", Navigation.pathFor(page, ctx)); // a real, routable href
    const el = writer.currentElement();
    if (el) {
      Zones.markForReplace(el); // keep the click listener correct across zone refreshes
      el.addEventListener("click", (e) => {
        e.preventDefault();
        Navigation.navigate(page, ctx);
      });
    }
  }

  afterRender(writer: MarkupWriter): void {
    writer.end();
  }
}
