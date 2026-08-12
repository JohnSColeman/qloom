import { Page, Property } from "@qloom/runtime";

/**
 * tapestry: AjaxTests#form_fragment — FormFragment is a portion of a Form that may
 * be selectively displayed (its `visible` binding).
 */
export class FormFragmentDemo extends Page {
  @Property showExtra = true;
}
