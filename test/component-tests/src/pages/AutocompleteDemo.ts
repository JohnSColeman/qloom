import { Page, Property } from "@qloom/runtime";
import { Navigation } from "@qloom/core";

/** Ported from Tapestry Autocomplete: text fields with the autocomplete mixin.
 *  `onProvideCompletionsFrom<Id>` supplies matches — synchronously (city) or as a
 *  Promise (fruit), the latter exercising the async source + stale-response guard. */
export class AutocompleteDemo extends Page {
  @Property city = "";
  @Property fruit = "";

  private static readonly CITIES = [
    "London",
    "Londonderry",
    "Los Angeles",
    "Lyon",
    "Lisbon",
    "Leeds",
  ];

  onProvideCompletionsFromCity(input: string): string[] {
    const q = String(input).toLowerCase();
    return AutocompleteDemo.CITIES.filter((c) => c.toLowerCase().startsWith(q));
  }

  onProvideCompletionsFromFruit(input: string): Promise<string[]> {
    const q = String(input).toLowerCase();
    const all = ["apple", "apricot", "avocado", "banana", "blueberry", "cherry"];
    const matches = all.filter((f) => f.startsWith(q));
    // The single-char query resolves slowly, so it lands AFTER a later query —
    // the stale guard must discard it rather than clobber the newer results.
    const delay = q === "a" ? 300 : 40;
    return new Promise((resolve) => setTimeout(() => resolve(matches), delay));
  }

  onSubmitFromForm(): void {
    Navigation.navigate("submit-result", [this.city || "blank"]);
  }
}
