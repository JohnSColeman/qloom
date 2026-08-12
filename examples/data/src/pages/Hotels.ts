import { Page, Property } from "@qloom/runtime";
import { bookingApi, type Hotel } from "../../dal/BookingApi";

/** Lists hotels from the generated `searchHotels` operation. */
export class Hotels extends Page {
  @Property hotels: Hotel[] = [];
  @Property hotel!: Hotel; // loop variable

  override async onActivate(): Promise<void> {
    this.hotels = await bookingApi.searchHotels({});
  }

  get hasHotels(): boolean {
    return this.hotels.length > 0;
  }
  get never(): boolean {
    return false;
  }
}
