import { Page, Property } from "@qloom/runtime";

/**
 * tapestry: Select `blankOption`/`blankLabel` — a leading empty option whose
 * value is always "" and which is never selected. `blankOption` is ALWAYS /
 * NEVER / AUTO (default); AUTO shows the blank only when the field is not
 * required. `blankLabel` supplies its label (default empty string).
 */
export class SelectBlankDemo extends Page {
  @Property always = "";
  @Property alwaysbare = "";
  @Property never = "";
  @Property auto = "";
}
