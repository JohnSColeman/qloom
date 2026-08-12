import { Page, Property } from "@qloom/runtime";

/**
 * tapestry: FormTests — a Checklist over an empty model renders zero checkboxes
 * and must not crash. No submit path needed; this page exists to exercise the
 * empty-model edge.
 */
export class ChecklistEmptyDemo extends Page {
  @Property selected: string[] = [];
  @Property empty: string[] = [];
}
