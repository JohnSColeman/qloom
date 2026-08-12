import type { OptionModel } from "./types.js";

/**
 * Tapestry: `AbstractSelectModel`/`SelectModel`. The base a `Select`'s `model`
 * extends; `getOptions()` supplies the options. App models (BedType, Months,
 * Years, …) subclass this.
 */
export abstract class SelectModel {
  abstract getOptions(): OptionModel[];
}
