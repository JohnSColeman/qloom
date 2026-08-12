import { Page, Property } from "@qloom/runtime";

/**
 * tapestry: Dynamic lets a component render itself differently at different times
 * via an external template.
 */
export class DynamicDemo extends Page {
  @Property fragment = "<p id='dyn'>dynamic body</p>";
  // Rich markup: multiple real DOM nodes materialised via writer.raw().
  @Property rich = "<ul id='rich'><li class='ri'>a</li><li class='ri'>b</li></ul>";
  // Hostile markup: a <script> injected via writer.raw() must NOT execute
  // (template.innerHTML clones inert), while inert siblings still render.
  @Property hostile = "<span id='safe'>ok</span><script>window.__pwned = true;</script>";
}
