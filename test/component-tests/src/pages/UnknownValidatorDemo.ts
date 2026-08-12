import { Page, Property } from "@qloom/runtime";

/** Its template binds t:validate="bogus" — an unregistered validator. The
 *  markup path must now throw (same policy as the @Validate annotation path)
 *  rather than silently skipping validation for the field. */
export class UnknownValidatorDemo extends Page {
  @Property name = "";
}
