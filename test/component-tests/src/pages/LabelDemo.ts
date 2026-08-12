import { Page, Property } from "@qloom/runtime";

/**
 * tapestry: Label generates a <label> for a field. With a body it renders the
 * body; with an empty body it renders the humanized field id.
 */
export class LabelDemo extends Page {
  @Property email = "";
  @Property fullName = "";
  @Property checkInDate = "";
}
