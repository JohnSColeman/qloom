import { Page, Property } from "@qloom/runtime";

/**
 * tapestry: ZoneTests — an EventLink triggers a handler, then the bound Zone
 * re-renders client-side (no server round-trip).
 */
export class ZoneDemo extends Page {
  @Property selectedName = "";
  @Property message = "";
  @Property count = 0;

  get statusText(): string {
    return this.selectedName ? `Selected: ${this.selectedName}` : "No name has been selected.";
  }

  onSelect(): void {
    this.selectedName = "Mr. <Roboto>";
  }

  onUpdateEmpty(): void {
    this.message = "Zone updated.";
  }

  // A dynamic body: each event bumps a counter so a second update in a row must
  // land on the LATEST value (regression against a zone re-render using a stale
  // closure/value).
  onBump(): void {
    this.count++;
  }
}
