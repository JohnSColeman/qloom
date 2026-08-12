import { Page, Property } from "@qloom/runtime";

/**
 * tapestry: OutputTest — Output writes its (stringified) value as *escaped* text.
 * Covers number/boolean/zero/null/empty/HTML-special values, plus a Zone that
 * re-renders the Output with a hostile value that must stay escaped.
 */
export class OutputCasesDemo extends Page {
  @Property num = 42;
  @Property zero = 0;
  @Property flag = false;
  @Property nothing: unknown = null;
  @Property blank = "";
  @Property html = "<b>bold</b>";
  @Property poisoned = "safe";

  onPoison(): void {
    this.poisoned = '<img src=x onerror="window.__outputXss = true">';
  }
}
