import { Page, Property } from "@qloom/runtime";

/** Target page — reports its activation context (tapestry: PageLink Context Demo). */
export class PageLinkTarget extends Page {
  @Property result = "No activation context.";

  override onActivate(context: readonly string[]): void {
    // Join all segments so a multi-value context ("a","b") is observable as
    // "a/b"; a single value ("hello") is unchanged.
    this.result = context.length ? context.join("/") : "No activation context.";
  }
}
