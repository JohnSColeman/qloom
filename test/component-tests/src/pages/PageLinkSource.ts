import { Page, Property } from "@qloom/runtime";

/** tapestry: CoreBehaviorsTests — PageLink renders a routable link to another page. */
export class PageLinkSource extends Page {
  /** A multi-value activation context (two URL segments). */
  @Property pair = ["a", "b"];
}
