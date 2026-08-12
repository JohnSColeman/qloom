import { bookingApi, type BookingRecord } from "../../dal/BookingApi";

/**
 * The client-side stand-in for Tapestry's `CrudServiceDAO` as used by
 * `YourBookings` — a static class (module rule 4) holding the current user's
 * confirmed bookings, backed by the generated `/bookings` client.
 *
 * Qloom render phases are synchronous, so a component cannot fetch during render.
 * The owning page (`Search`) hydrates this store in `onActivate` (async); the
 * `YourBookings` component then reads it synchronously and re-fetches after a
 * cancel. This keeps the list reconstructable from the backend (PLAN §3) rather
 * than from in-memory component state.
 */
export class MyBookings {
  private static items: BookingRecord[] = [];
  private static username = "";

  static list(): BookingRecord[] {
    return MyBookings.items;
  }

  /** Load the given user's bookings from the backend (Search.onActivate). */
  static async hydrate(username: string): Promise<void> {
    MyBookings.username = username;
    MyBookings.items = await bookingApi.listBookings({ username });
  }

  /** Cancel a booking, then refresh the list from the backend. */
  static async cancel(id: number): Promise<void> {
    await bookingApi.cancelBooking({ id });
    await MyBookings.hydrate(MyBookings.username);
  }
}
