import { Page, Property } from "@qloom/runtime";
import { bookingApi, type Hotel as HotelDto } from "../../dal/BookingApi";

/** Loads one hotel by the activation-context id via the generated `getHotel`. */
export class Hotel extends Page {
  @Property hotel: HotelDto | null = null;

  override async onActivate(context: readonly string[]): Promise<void> {
    this.hotel = await bookingApi.getHotel({ id: Number(context[0]) });
  }
}
