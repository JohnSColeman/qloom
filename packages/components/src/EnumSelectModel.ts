import { SelectModel } from "./SelectModel.js";
import type { OptionModel } from "./types.js";

/** Tapestry: the enum-derived SelectModel a `Select` gets for an enum-typed
 *  value with no explicit model. Build one from a (string) enum object. */
export class EnumSelectModel extends SelectModel {
  private readonly options: OptionModel[];
  constructor(enumObject: Record<string, string | number>) {
    super();
    this.options = Object.values(enumObject)
      .filter((v) => typeof v === "string")
      .map((v) => ({ label: String(v), value: String(v) }));
  }
  getOptions(): OptionModel[] {
    return this.options;
  }
}
