import { Component } from "@qloom/runtime";
import { Zones } from "@qloom/core";
import { MyBookings } from "../data/MyBookings";
import type { BookingRecord } from "../../dal/BookingApi";

/**
 * Tapestry: `com.tap5.hotelbooking.components.YourBookings` — lists the logged-in
 * user's confirmed bookings, each with a cancel link. Rendering comes from the
 * unchanged `YourBookings.tml`.
 *
 * Mechanical port of the Java: `@SetupRender` returns whether there are any
 * bookings (Java `bookings.size() > 0`) so the panel is skipped when empty, and
 * `@OnEvent("cancelBooking")` deletes one. Tapestry injects `CrudServiceDAO`;
 * Qloom reads/mutates through `MyBookings` (backed by the generated `/bookings`
 * client), hydrated by `Search.onActivate`. Cancel is async — the handler must
 * return void (a returned Promise would be taken as a navigation target), so it
 * fires the delete and refreshes the enclosing zone when it resolves.
 */
export class YourBookings extends Component {
  /** Bound by the template's `<t:loop t:value="current">`. */
  current!: BookingRecord;

  get bookings(): BookingRecord[] {
    return MyBookings.list();
  }

  setupRender(): boolean {
    return MyBookings.list().length > 0;
  }

  onCancelBooking(booking: BookingRecord): void {
    void MyBookings.cancel(booking.id).then(() => Zones.refreshZone("mybookings"));
  }
}
