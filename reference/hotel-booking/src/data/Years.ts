import { SelectModel, type OptionModel } from "@qloom/components";

/** Ported from com.tap5.hotelbooking.data.Years — the current year plus the next
 *  five (Tapestry: `new Years()`). */
export class Years extends SelectModel {
  private readonly options: OptionModel[];

  constructor() {
    super();
    const base = new Date().getFullYear();
    this.options = Array.from({ length: 6 }, (_, i) => ({ label: String(base + i), value: base + i }));
  }

  getOptions(): OptionModel[] {
    return this.options;
  }
}
