// The only hand-written dal file: re-export the generated client + schema types
// (§10.9 option A). The generated code lives in the gitignored .qloom/ cache.
export { api as bookingApi } from "@dal/hotel-booking";
export type { Hotel, User } from "@dal/hotel-booking";
