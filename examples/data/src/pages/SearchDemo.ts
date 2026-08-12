import { Page, Property } from "@qloom/runtime";
import { bookingApi, type Hotel } from "../../dal/BookingApi";

/** A form with `t:zone="results"`: submitting filters the hotels and the
 *  results zone re-renders in place (Ajax) — no navigation. */
export class SearchDemo extends Page {
  @Property query = "";
  @Property results: Hotel[] = [];
  @Property currentHotel!: Hotel;

  override async onActivate(): Promise<void> {
    this.results = await bookingApi.searchHotels({});
  }

  async onSubmitFromSearchForm(): Promise<void> {
    this.results = await bookingApi.searchHotels({ name: this.query });
  }
}
