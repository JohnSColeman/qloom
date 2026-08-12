import { SelectModel, type OptionModel } from "@qloom/components";

/** Ported from com.tap5.hotelbooking.data.Months (extends AbstractSelectModel). */
export class Months extends SelectModel {
  private readonly options: OptionModel[] = [
    "January", "February", "March", "April", "Mai", "June",
    "July", "August", "September", "October", "November", "December",
  ].map((label, i) => ({ label, value: i + 1 }));

  getOptions(): OptionModel[] {
    return this.options;
  }
}
