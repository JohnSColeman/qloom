import { Page, Property, SessionState } from "@qloom/runtime";
import { bookingApi, type Hotel } from "../../dal/BookingApi";
import { SearchCriteria } from "../data/SearchCriteria";
import { MyBookings } from "../data/MyBookings";
import { authenticator } from "../services/auth";

/**
 * Ported from com.tap5.hotelbooking.pages.Search.
 *
 * `criteria` is `@SessionState` (as in the Java) — a session-scoped object, so
 * the search term survives navigating away and back instead of resetting on each
 * fresh page instance. The Grid's `source` filters the fetched hotels by it
 * (Tapestry uses a HibernateGridDataSource server-side). The form's
 * `t:zone="result"` re-renders the results zone on submit, so `source` re-reads.
 */
export class Search extends Page {
  @SessionState(SearchCriteria)
  criteria!: SearchCriteria;

  @Property allHotels: Hotel[] = [];
  @Property currentHotel!: Hotel;

  override async onActivate(): Promise<void> {
    this.allHotels = await bookingApi.searchHotels({});
    await MyBookings.hydrate(authenticator.getLoggedUser()?.username ?? "");
  }

  get source(): Hotel[] {
    const q = this.criteria.query?.trim().toLowerCase();
    return q ? this.allHotels.filter((h) => h.name.toLowerCase().includes(q)) : this.allHotels;
  }
}
