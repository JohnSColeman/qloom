import { Page, Property } from "@qloom/runtime";

/** Ported from Tapestry ZoneRefresh: a Zone with the zonerefresh mixin that
 *  auto-refreshes on a timer. Each tick fires a `refresh` event; the page bumps
 *  its state and the zone re-renders. A window counter lets the teardown test
 *  observe the timer stopping once the zone is navigated away from. */
export class ZoneRefreshDemo extends Page {
  @Property tick = 0;

  onRefresh(): void {
    this.tick++;
    const w = window as unknown as { __zrTicks?: number };
    w.__zrTicks = (w.__zrTicks ?? 0) + 1;
  }
}
