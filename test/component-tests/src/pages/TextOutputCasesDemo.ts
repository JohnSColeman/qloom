import { Page, Property } from "@qloom/runtime";

/**
 * tapestry: TextOutputTest — TextOutput emits one <p> per line, escaping each
 * line. Covers single line, empty string, HTML-special line, and null.
 */
export class TextOutputCasesDemo extends Page {
  @Property single = "just one line";
  @Property blank = "";
  @Property html = "<b>x</b>\nplain";
  @Property nothing: string | null = null;
}
