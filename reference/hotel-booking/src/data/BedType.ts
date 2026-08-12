import { SelectModel, type OptionModel } from "@qloom/components";

/** Ported from com.tap5.hotelbooking.data.BedType (extends AbstractSelectModel). */
export class BedType extends SelectModel {
  private readonly options: OptionModel[] = [
    { label: "One king-sized bed", value: 1 },
    { label: "Two double beds", value: 2 },
    { label: "Three beds", value: 3 },
  ];

  getOptions(): OptionModel[] {
    return this.options;
  }
}
