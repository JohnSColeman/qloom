import { Page, Property } from "@qloom/runtime";

/** Binds the `strict` (allowNull=false) parameter to a null property — reading
 *  it must throw at render, surfaced via the error boundary. */
export class AllowNullNullDemo extends Page {
  @Property nothing: string | null = null;
  @Property something = "x";
}
