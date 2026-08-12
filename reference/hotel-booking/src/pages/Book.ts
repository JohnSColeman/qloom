import { Page, Property, SessionState } from "@qloom/runtime";
import { Navigation } from "@qloom/core";
import { EnumSelectModel, type SelectModel } from "@qloom/components";
import { bookingApi } from "../../dal/BookingApi";
import { authenticator } from "../services/auth";
import { UserWorkspace } from "../data/UserWorkspace";
import { BedType } from "../data/BedType";
import { Months } from "../data/Months";
import { Years } from "../data/Years";
import { CreditCardType } from "../data/CreditCardType";
import type { Booking } from "../data/Booking";

/**
 * Ported from com.tap5.hotelbooking.pages.Book — the multi-step booking wizard.
 *
 * `<t:delegate to="step">` renders `bookBlock` (the form) or `confirmBlock`
 * (the confirmation) depending on `confirmationStep`. Tapestry drives the
 * transition by a redirect-after-post that re-renders the page; Qloom does the
 * same by re-navigating to `/book/<hotelId>` (onActivate re-reads the booking's
 * status from the `@SessionState` UserWorkspace). The two blocks are hoisted
 * onto the instance by the compiled template.
 */
export class Book extends Page {
  @Property booking: Booking | null = null;

  @SessionState(UserWorkspace, { persist: false })
  userWorkspace!: UserWorkspace;

  // Bound as `t:model` in the template (Tapestry SelectModels).
  @Property bedType: SelectModel = new BedType();
  @Property months: SelectModel = new Months();
  @Property years: SelectModel = new Years();

  // Block fields assigned by the compiled template (hoisted `<t:block t:id>`).
  declare bookBlock: (writer: unknown) => void;
  declare confirmBlock: (writer: unknown) => void;

  private confirmationStep = false;

  /** The `creditCardType` select has no `t:model` — Tapestry infers it from the
   *  enum; Qloom derives an EnumSelectModel via the `<id>Model` convention. */
  get creditCardTypeModel(): SelectModel {
    return new EnumSelectModel(CreditCardType);
  }

  get step(): (writer: unknown) => void {
    return this.confirmationStep ? this.confirmBlock : this.bookBlock;
  }

  get securedCardNumber(): string {
    return this.booking?.creditCardNumber.substring(12) ?? "";
  }

  override onActivate(context: readonly string[]): unknown {
    const hotelId = Number(context[0]);
    this.booking = this.userWorkspace.restoreBooking(hotelId);
    if (!this.booking) return "search"; // nothing in progress → back to search
    this.confirmationStep = this.booking.status;
    return null;
  }

  /** bookingForm submit: cross-field date validation (Tapestry's VALIDATE), then
   *  advance to the confirmation step (its redirect-after-post re-render). */
  onSubmitFromBookingForm(): unknown {
    const booking = this.booking;
    if (!booking) return "search";
    const today = new Date().toISOString().slice(0, 10);
    if (booking.checkinDate < today) return "Check-in date must be in the future";
    if (booking.checkinDate >= booking.checkoutDate) return "Check-out date must be after check-in";

    booking.status = true;
    Navigation.navigate("book", [String(booking.hotel.id)]);
    return null;
  }

  /** confirmForm submit: persist the booking (Tapestry: `CrudServiceDAO.create`)
   *  and return to Search. Awaited by Form, so it completes before Search's
   *  `onActivate` re-reads the bookings list. */
  async onSubmitFromConfirmForm(): Promise<unknown> {
    const booking = this.booking;
    if (booking) {
      await bookingApi.createBooking({
        username: authenticator.getLoggedUser()?.username ?? "",
        hotelId: booking.hotel.id,
        checkinDate: booking.checkinDate,
        checkoutDate: booking.checkoutDate,
      });
    }
    this.userWorkspace.confirmCurrentBooking(this.booking);
    this.booking = null;
    return "search";
  }

  /** cancelBooking event link: drop the in-progress booking, back to Search. */
  onCancelBooking(): unknown {
    this.userWorkspace.cancelCurrentBooking(this.booking);
    this.booking = null;
    return "search";
  }

  /** cancelConfirm event link: step back from confirmation to the form. */
  onCancelConfirm(): unknown {
    if (this.booking) {
      this.booking.status = false;
      Navigation.navigate("book", [String(this.booking.hotel.id)]);
    }
    return null;
  }
}
