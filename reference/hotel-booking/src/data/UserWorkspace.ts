import type { Hotel } from "../../dal/BookingApi";
import { Booking } from "./Booking";

/**
 * Ported from com.tap5.hotelbooking.data.UserWorkspace — Tapestry's
 * `@SessionState` booking scratchpad. Declared `@SessionState(UserWorkspace)` on
 * Book/View so it's shared across those pages; it holds the current in-progress
 * booking and the not-yet-confirmed list, so navigating to `/book/<hotelId>` can
 * restore the booking by hotel id. Registered `persist:false` — an in-progress
 * booking carries a credit-card number, which (like Tapestry's server session)
 * must never be written to browser storage.
 */
export class UserWorkspace {
  current: Booking | null = null;
  private notConfirmed: Booking[] = [];

  getCurrent(): Booking | null {
    return this.current;
  }

  /** The bookings started but not yet confirmed (Tapestry: `getNotConfirmed()`). */
  getNotConfirmed(): Booking[] {
    return this.notConfirmed;
  }

  startBooking(hotel: Hotel, fullname: string): Booking {
    const booking = new Booking(hotel, fullname, 1, 1);
    this.current = booking;
    this.notConfirmed.push(booking);
    return booking;
  }

  restoreBooking(hotelId: number): Booking | null {
    this.current = this.notConfirmed.find((b) => b.hotel.id === hotelId) ?? null;
    return this.current;
  }

  cancelCurrentBooking(booking: Booking | null): void {
    this.remove(booking);
  }

  confirmCurrentBooking(booking: Booking | null): void {
    this.remove(booking);
  }

  private remove(booking: Booking | null): void {
    this.notConfirmed = this.notConfirmed.filter((b) => b !== booking);
    this.current = null;
  }
}
