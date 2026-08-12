import { Component, Parameter } from "@qloom/runtime";
import { applyInformals, triggerEvent, Navigation, Zones } from "@qloom/core";
import type { MarkupWriter } from "@qloom/core";

/**
 * Renders `<a href="#">` and, on click, triggers a component event in memory
 * (the fast-path from PLAN §7) — optionally re-rendering a Zone afterwards.
 * Tapestry: `EventLink` (and `ActionLink`, which fixes the event to "action").
 */
export class EventLink extends Component {
  @Parameter() event = "action";
  @Parameter() zone?: string;
  @Parameter() context?: unknown;

  beginRender(writer: MarkupWriter): void {
    // Snapshot the bound parameters NOW, at render time, into local consts —
    // matching PageLink's `const ctx = this.context …`. `event`/`zone`/`context`
    // are frequently bound to a `t:loop` variable (a container property, per
    // the compiler's Tapestry-faithful "loop variables are container
    // properties" model — see compileTemplate.ts). That container property is
    // overwritten on every iteration and holds only the LAST item once the
    // loop (and thus the whole render pass) finishes. Reading `this.event`/
    // `this.context` lazily inside the click listener — as this used to do —
    // re-evaluates that live binding at click time, long after rendering
    // completed, so EVERY link produced by a loop would fire with the LAST
    // item's values instead of its own. Capturing plain values here, in the
    // same render pass that set the loop variable for this iteration, is what
    // makes each link fire with the values it was rendered with.
    const event = this.event;
    const zone = this.zone;
    const context = this.context;
    writer.element("a");
    applyInformals(writer, this);
    writer.attribute("href", "#");
    const el = writer.currentElement();
    if (el) {
      Zones.markForReplace(el); // keep the click listener correct across zone refreshes
      const self = this;
      el.addEventListener("click", (e) => {
        e.preventDefault();
        // A handler that returns a page target triggers navigation (redirect);
        // otherwise refresh the named zone, if any.
        const result = triggerEvent(self, event, context);
        if (result != null) Navigation.navigate(result);
        else if (zone) Zones.refreshZone(zone);
      });
    }
  }

  afterRender(writer: MarkupWriter): void {
    writer.end(); // </a>
  }
}
