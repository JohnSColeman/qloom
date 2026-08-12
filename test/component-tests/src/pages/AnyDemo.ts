import { Page, Property } from "@qloom/runtime";

/**
 * tapestry: AnyTest — Any renders an arbitrary element (from its `element`
 * parameter) including informal parameters.
 */
export class AnyDemo extends Page {
  // Bound to a dynamic `element` via the `prop:` prefix (element defaults to
  // the LITERAL prefix, so a plain value is a literal tag name).
  @Property tag = "article";
}
