import { Component, Parameter } from "@qloom/runtime";
import { applyInformals, BINDINGS } from "@qloom/core";
import type { MarkupWriter, RenderBody } from "@qloom/core";
import { humanize } from "./humanize.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tapestry: `BeanDisplay` — renders a bean's properties as a `<dl>`. `include`
 * gives the ordered property list, `exclude` omits; a `<p:property>` block
 * overrides how that property renders (e.g. `<p:stars>` → a HotelClass).
 */
export class BeanDisplay extends Component {
  @Parameter() object: any;
  @Parameter() include = "";
  @Parameter() exclude = "";

  beginRender(writer: MarkupWriter): boolean {
    const obj = this.object ?? {};
    const included = this.include.split(",").map((s) => s.trim()).filter(Boolean);
    const excluded = new Set(this.exclude.split(",").map((s) => s.trim()).filter(Boolean));
    const props = included.length ? included : Object.keys(obj);
    const bindings = (this as any)[BINDINGS] ?? {};

    writer.element("dl");
    applyInformals(writer, this);
    // Tapestry 5.3.x: the outer <dl> carries the "t-beandisplay" CSS class (the app
    // stylesheet targets `DL.t-beandisplay`), merged with any informal class such as
    // the page's "hotel-details" — not replacing it.
    const informalClass = writer.currentElement()?.getAttribute("class");
    writer.attribute("class", informalClass ? `t-beandisplay ${informalClass}` : "t-beandisplay");
    for (const prop of props) {
      if (excluded.has(prop)) continue;
      // Non-lean BeanDisplay tags each <dt>/<dd> with the property id.
      writer.element("dt");
      writer.attribute("class", prop);
      writer.text(humanize(prop));
      writer.end();
      writer.element("dd");
      writer.attribute("class", prop);
      const block = bindings[prop]?.get?.();
      if (typeof block === "function") (block as RenderBody)(writer);
      else writer.text(String(obj[prop] ?? ""));
      writer.end();
    }
    writer.end();
    return false; // no body
  }
}
