import { Component } from "@qloom/runtime";
import { applyInformals, Messages } from "@qloom/core";
import type { MarkupWriter } from "@qloom/core";

/**
 * A `<select>` of the registered locales (`Messages.getAvailableLocales()`) that
 * switches the site language on change (`Messages.setLocale`), which persists the
 * choice and re-renders the page. Each option is labelled with the language's own
 * name (endonym) where the platform can, else the locale code. Not a Tapestry
 * component — Qloom's built-in for the user-facing "change language" control.
 */
export class LocaleSelector extends Component {
  beginRender(writer: MarkupWriter): boolean {
    writer.element("select");
    applyInformals(writer, this);
    writer.attribute("aria-label", "Language");
    const el = writer.currentElement() as HTMLSelectElement | null;
    const active = Messages.getLocale();
    for (const locale of Messages.getAvailableLocales()) {
      writer.element("option");
      writer.attribute("value", locale);
      if (locale === active) writer.attribute("selected", "selected");
      writer.text(LocaleSelector.label(locale));
      writer.end();
    }
    el?.addEventListener("change", () => Messages.setLocale(el.value));
    return false; // no body
  }
  afterRender(writer: MarkupWriter): void {
    writer.end();
  }

  /** The language's own name (e.g. "English", "français"), else the code. */
  private static label(locale: string): string {
    try {
      const base = locale.split(/[-_]/)[0] ?? locale;
      const names = new Intl.DisplayNames([locale], { type: "language" });
      return names.of(base) ?? locale;
    } catch {
      return locale;
    }
  }
}
