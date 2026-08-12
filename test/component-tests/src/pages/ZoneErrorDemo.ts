import { Page, Property } from "@qloom/runtime";

/** A zone whose body throws when refreshed (count > 0). Exercises the scoped
 *  zone-render boundary in Zones.refreshZone: the error is reported (phase
 *  "zone") but the failure stays local — the page is NOT replaced with the
 *  generic error page, and the zone is left as-is. */
export class ZoneErrorDemo extends Page {
  @Property count = 0;

  onBump(): void {
    this.count++;
  }

  get body(): string {
    if (this.count > 0) throw new Error("zone boom");
    return "ok";
  }
}
