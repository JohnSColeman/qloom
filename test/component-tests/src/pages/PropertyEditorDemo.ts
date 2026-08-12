import { Page, Property } from "@qloom/runtime";

/**
 * tapestry: PropertyEditorTest — PropertyEditor edits a single bean property
 * (used primarily by BeanEditForm).
 */
export class PropertyEditorDemo extends Page {
  @Property person = { firstName: "Ada", lastName: "Lovelace", middleName: "" };
}
