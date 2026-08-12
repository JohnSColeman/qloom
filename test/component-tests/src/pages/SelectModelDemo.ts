import { Page, Property } from "@qloom/runtime";
import { Navigation } from "@qloom/core";

/**
 * tapestry: SelectTest — a Select over an {label,value} OptionModel renders the
 * labels but binds the value (value encoder), escapes option labels, and copes
 * with an empty model (zero options, no crash). On submit it PRGs the bound value
 * to the shared select-result page.
 */
export class SelectModelDemo extends Page {
  // Bound to a value ("b"), NOT a label — proves the value encoder round-trips.
  @Property fruit = "b";
  @Property fruits = [
    { label: "Apple <b>fresh</b>", value: "a" }, // label carries markup → must be escaped
    { label: "Banana", value: "b" },
    { label: "Cherry", value: "c" },
  ];
  // A second Select whose model is empty: renders <select> with zero <option>s.
  @Property empty = "";
  @Property emptyModel: Array<{ label: string; value: string }> = [];

  onSubmitFromForm(): void {
    Navigation.navigate("select-result", [this.fruit]);
  }
}
