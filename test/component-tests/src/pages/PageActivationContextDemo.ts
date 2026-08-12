import { Page, Property, PageActivationContext } from "@qloom/runtime";

/** Two @PageActivationContext fields bind to successive URL segments in
 *  declaration order (id first, kind second). @Property makes them template-
 *  readable. With no onPassivate, the router re-synthesises the URL from them. */
export class PageActivationContextDemo extends Page {
  @Property @PageActivationContext() id = 0;
  @Property @PageActivationContext() kind = "";
}
