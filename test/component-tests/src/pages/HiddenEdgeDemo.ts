import { Page, Property } from "@qloom/runtime";
import { Navigation } from "@qloom/core";

/**
 * tapestry: HiddenTest — Hidden edge coverage: an HTML/script-bearing value
 * (must render inert, no injection), a plain value that round-trips through a
 * submit (PRG), and an empty value that renders a blank input.
 */
export class HiddenEdgeDemo extends Page {
  @Property markup = '<img src=x onerror="window.__hacked=true">';
  @Property count = "42";
  @Property blank = "";

  onSubmitFromForm(): void {
    Navigation.navigate("hidden-result", [this.count]);
  }
}
