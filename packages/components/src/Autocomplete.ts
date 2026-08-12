import { Component, Parameter, MixinAfter, InjectContainer } from "@qloom/runtime";
import { triggerEvent } from "@qloom/core";
import type { MarkupWriter } from "@qloom/core";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tapestry `Autocomplete` — a mixin on a text field that offers type-ahead
 * suggestions. As the user types past `minChars`, it fires a `provideCompletions`
 * event up the container chain; the page's `onProvideCompletionsFrom<Id>(input)`
 * returns the matches — synchronously (`string[]`) or asynchronously
 * (`Promise<string[]>`, the normal case, e.g. a DAL call). Matches render in a
 * dropdown; the user picks one with the mouse or keyboard.
 *
 * Qloom deletes Tapestry's server round-trip and its `t5/core/autocomplete`
 * client module — the completion source is the local event handler, and the
 * dropdown is native. Two design points matter:
 *  - **Stale guard:** each query carries a sequence id; a response for an earlier
 *    keystroke that resolves after a later one is discarded (async ordering).
 *  - **Teardown:** the menu is inserted as the field's sibling, so it detaches
 *    with the field on navigation; listeners live on the field and are GC'd with
 *    it. Nothing to clean up.
 *
 * (Deferred vs. Tapestry: object `{label,value}` suggestions, the `context`
 * parameter, and full ARIA combobox semantics — see BACKLOG §3.)
 */
@MixinAfter
export class Autocomplete extends Component {
  /** Don't query until this many characters are typed (Tapestry `minChars`). */
  @Parameter() minChars = 1;
  /** Cap the dropdown to this many items (Tapestry `maxSuggestions`). */
  @Parameter() maxSuggestions = 5;
  /** Debounce, in ms, before querying after a keystroke (Qloom addition). */
  @Parameter() debounce = 150;

  @InjectContainer private host: any;

  beginRender(writer: MarkupWriter): void {
    writer.attribute("autocomplete", "off"); // suppress the browser's own autofill
  }

  afterRender(writer: MarkupWriter): void {
    const input = writer.currentElement() as HTMLInputElement | null;
    if (!input) return;
    const host = this.host;
    const minChars = Math.max(1, Number(this.minChars) || 1);
    const limit = Math.max(1, Number(this.maxSuggestions) || 1);
    const debounceMs = Math.max(0, Number(this.debounce) || 0);
    // Defer DOM setup until this render pass has committed (the field is then in
    // the live tree with a parent to host the menu).
    setTimeout(() => Autocomplete.install(input, host, minChars, limit, debounceMs), 0);
  }

  private static install(
    input: HTMLInputElement,
    host: any,
    minChars: number,
    limit: number,
    debounceMs: number,
  ): void {
    const parent = input.parentElement;
    if (!parent) return;
    if (getComputedStyle(parent).position === "static") parent.style.position = "relative";

    const menu = document.createElement("ul");
    menu.className = "t-autocomplete-menu";
    if (input.name) menu.setAttribute("data-autocomplete-for", input.name); // addressable per field
    menu.style.cssText =
      "position:absolute;z-index:1000;margin:0;padding:0;list-style:none;display:none;" +
      "background:#fff;border:1px solid #ccc;max-height:12em;overflow:auto;";
    parent.insertBefore(menu, input.nextSibling);

    let seq = 0;
    let items: string[] = [];
    let active = -1;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const close = (): void => {
      menu.style.display = "none";
      active = -1;
    };
    const highlight = (): void => {
      Array.from(menu.children).forEach((li, i) => {
        if (i === active) {
          li.setAttribute("data-active", "");
          (li as HTMLElement).scrollIntoView({ block: "nearest" });
        } else {
          li.removeAttribute("data-active");
        }
      });
    };
    const select = (i: number): void => {
      if (i < 0 || i >= items.length) return;
      input.value = items[i] as string;
      close();
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    };
    const render = (): void => {
      menu.replaceChildren();
      items.forEach((label, i) => {
        const li = document.createElement("li");
        li.className = "t-autocomplete-item";
        li.textContent = label;
        li.style.cssText = "padding:2px 8px;cursor:pointer;white-space:nowrap;";
        // mousedown (not click) so the field doesn't blur-close before selection.
        li.addEventListener("mousedown", (e) => {
          e.preventDefault();
          select(i);
        });
        menu.appendChild(li);
      });
      if (items.length) {
        menu.style.left = `${input.offsetLeft}px`;
        menu.style.top = `${input.offsetTop + input.offsetHeight}px`;
        menu.style.minWidth = `${input.offsetWidth}px`;
        menu.style.display = "";
      } else {
        close();
      }
    };
    const query = (): void => {
      const value = input.value;
      if (value.length < minChars) {
        close();
        return;
      }
      const mySeq = ++seq;
      Promise.resolve(triggerEvent(host, "provideCompletions", value))
        .then((result) => {
          if (mySeq !== seq) return; // a newer query superseded this one — discard
          items = (Array.isArray(result) ? result : []).slice(0, limit).map(String);
          active = -1;
          render();
        })
        .catch(() => close());
    };

    input.addEventListener("input", () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(query, debounceMs);
    });
    input.addEventListener("keydown", (e) => {
      if (menu.style.display === "none") return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        active = Math.min(active + 1, items.length - 1);
        highlight();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        active = Math.max(active - 1, 0);
        highlight();
      } else if (e.key === "Enter") {
        if (active >= 0) {
          e.preventDefault();
          select(active);
        }
      } else if (e.key === "Escape") {
        close();
      }
    });
    // Clicking elsewhere blurs the field → close (a short delay lets a menu
    // mousedown-select land first).
    input.addEventListener("blur", () => setTimeout(close, 150));
  }
}
