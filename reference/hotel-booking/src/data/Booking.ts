import type { Hotel } from "../../dal/BookingApi";
import { CreditCardType } from "./CreditCardType";

/** ISO `yyyy-mm-dd` for a date `daysFromNow` from today (DateField's value shape). */
function isoDaysFromNow(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

/**
 * Ported from com.tap5.hotelbooking.entities.Booking. Dates are ISO
 * `yyyy-mm-dd` strings (what `<t:datefield>` binds). `total`/`nights` are
 * derived; `status` is the wizard flag (false = booking step, true = confirm).
 */
export class Booking {
  checkinDate: string;
  checkoutDate: string;
  beds = 1;
  smoking = false;
  creditCardNumber = "";
  creditCardType: CreditCardType = CreditCardType.VISA;
  creditCardName: string;
  creditCardExpiryMonth: number = new Date().getMonth() + 1;
  creditCardExpiryYear: number = new Date().getFullYear();
  status = false;

  constructor(
    public hotel: Hotel,
    fullname: string,
    daysFromNow = 1,
    nights = 1,
  ) {
    this.creditCardName = fullname;
    this.checkinDate = isoDaysFromNow(daysFromNow);
    this.checkoutDate = isoDaysFromNow(daysFromNow + nights);
  }

  get nights(): number {
    const inMs = Date.parse(this.checkoutDate) - Date.parse(this.checkinDate);
    return Math.round(inMs / 86_400_000);
  }

  get total(): number {
    return this.hotel.price * this.nights;
  }
}
