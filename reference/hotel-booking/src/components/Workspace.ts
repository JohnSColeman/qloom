import { Component, SessionState } from "@qloom/runtime";
import { UserWorkspace } from "../data/UserWorkspace";
import type { Booking } from "../data/Booking";

/**
 * Tapestry: `com.tap5.hotelbooking.components.Workspace` — the "Booking in
 * progress" panel listing the not-yet-confirmed bookings held in the session
 * `UserWorkspace`. Rendering comes from the unchanged `Workspace.tml`.
 *
 * Mechanical port of the Java: `@SessionState UserWorkspace`, the `current` loop
 * value, `getBookings()`/`getIsCurrent()`, and the `format` used by `<t:output>`.
 * Qloom's `Output` does not yet apply `format`, so dates render ISO rather than
 * `MM/dd/yyyy`; the property is kept so the template binding resolves.
 *
 * `getBookings()` returns an iterable that also exposes `.empty` so the template's
 * `<t:if test="bookings.empty">` (Java `List.isEmpty()` bean property) works
 * unchanged.
 */
export class Workspace extends Component {
  @SessionState(UserWorkspace, { persist: false })
  userWorkspace!: UserWorkspace;

  /** Bound by the template's `<t:loop t:value="current">`. */
  current!: Booking;

  /** Tapestry: `new SimpleDateFormat("MM/dd/yyyy")` (consumed by `<t:output>`). */
  format = "MM/dd/yyyy";

  get bookings(): Iterable<Booking> & { empty: boolean } {
    const items = this.userWorkspace.getNotConfirmed();
    return {
      empty: items.length === 0,
      [Symbol.iterator]: () => items[Symbol.iterator](),
    };
  }

  get isCurrent(): boolean {
    return this.userWorkspace.getCurrent() === this.current;
  }
}
