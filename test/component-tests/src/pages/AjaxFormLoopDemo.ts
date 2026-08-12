import { Page, Property } from "@qloom/runtime";

/**
 * tapestry: AjaxTests#ajax_form_loop — AjaxFormLoop is a Loop with Ajax add/remove
 * rows (via AddRowLink/RemoveRowLink).
 */
export class AjaxFormLoopDemo extends Page {
  @Property items: string[] = ["one", "two"];
  @Property item = "";
}
