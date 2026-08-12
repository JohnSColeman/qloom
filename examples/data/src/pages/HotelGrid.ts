import { Page, Property } from "@qloom/runtime";
import { bookingApi, type Hotel } from "../../dal/BookingApi";

/** Renders hotels through the Grid component (columns, row var, cell blocks). */
export class HotelGrid extends Page {
  @Property hotels: Hotel[] = [];
  @Property currentHotel!: Hotel; // grid `row` output binding

  override async onActivate(): Promise<void> {
    this.hotels = await bookingApi.searchHotels({});
  }
}
