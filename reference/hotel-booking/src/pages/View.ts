import { Page, Property, SessionState, PageActivationContext } from "@qloom/runtime";
import { Navigation } from "@qloom/core";
import { bookingApi, type Hotel } from "../../dal/BookingApi";
import { UserWorkspace } from "../data/UserWorkspace";
import { authenticator } from "../services/auth";

/**
 * Ported from com.tap5.hotelbooking.pages.View.
 *
 * Tapestry uses `@PageActivationContext Hotel hotel` (the hotel encoded in the
 * URL). Qloom has no ValueEncoder to turn an id into an entity, so it binds the
 * id with `@PageActivationContext` and fetches the hotel in `onActivate` via the
 * generated `getHotel`. `startBooking` (→ Book) awaits the Book page.
 */
export class View extends Page {
  @Property hotel: Hotel | null = null;

  @PageActivationContext()
  id = 0;

  @SessionState(UserWorkspace, { persist: false })
  userWorkspace!: UserWorkspace;

  override async onActivate(): Promise<void> {
    this.hotel = await bookingApi.getHotel({ id: this.id });
  }

  /**
   * startBookingForm submit (Tapestry: `@OnEvent(SUCCESS, "startBookingForm")`):
   * begin a booking for this hotel in the session workspace, then go to Book.
   */
  onSubmitFromStartBookingForm(): unknown {
    if (!this.hotel) return "search";
    const fullname = authenticator.getLoggedUser()?.fullname ?? "Guest";
    this.userWorkspace.startBooking(this.hotel, fullname);
    Navigation.navigate("book", [String(this.hotel.id)]);
    return null;
  }
}
