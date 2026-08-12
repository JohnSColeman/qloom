import { Component, Parameter, InjectContainer } from "@qloom/runtime";
import { Zones, triggerEvent, COMPONENT_ID } from "@qloom/core";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tapestry `ZoneRefresh` — a mixin that periodically refreshes its host Zone.
 * `@InjectContainer` gives it the Zone; on `afterRender` it starts a timer that
 * every `period` seconds fires a `refresh` event (so the page can update state,
 * as Tapestry's server round-trip lets the page re-render) and then re-renders
 * the zone locally through the focus-preserving reconciler.
 *
 * Qloom deletes Tapestry's server plumbing: no event link, no `JavaScriptSupport`
 * — the refresh is a local `Zones.refreshZone`. The one real concern is lifecycle:
 * the timer captures the zone's element and self-clears once that node detaches
 * (navigation, or an enclosing `If` turning the zone off), so nothing leaks and
 * no timer ever fires against a stale or reused zone.
 */
export class ZoneRefresh extends Component {
  /** Refresh interval in seconds (Tapestry's `period`, a literal). */
  @Parameter() period = 0;
  /** Optional context passed with the `refresh` event. */
  @Parameter() context: unknown[] = [];

  afterRender(): void {
    const zoneId = (this.zone as any)?.[COMPONENT_ID] as string | undefined;
    const ms = Number(this.period) * 1000;
    if (!zoneId || !(ms > 0)) return;

    // Capture the exact node this render registered; the timer lives and dies
    // with it, so a later page that reuses `zoneId` gets its own timer.
    const element = Zones.zoneElement(zoneId);
    if (!element) return;

    const timer = setInterval(() => {
      if (!element.isConnected) {
        clearInterval(timer);
        return;
      }
      triggerEvent(this.zone as object, "refresh", this.context);
      Zones.refreshZone(zoneId);
    }, ms);
  }

  @InjectContainer private zone: any;
}
