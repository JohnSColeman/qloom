import { Data, ApiError } from "@qloom/data";
import { bookingApi, type User, type Hotel } from "../../dal/BookingApi";

/** Seed users standing in for the database (served by the mock backend). */
const USERS: (User & { password: string })[] = [
  { id: 1, username: "JohnDoe", fullname: "John Doe", email: "john@example.com", password: "secret" },
];

/** Seed hotels. */
const HOTELS: Hotel[] = [
  { id: 1, name: "Marriott Courtyard", address: "125 Peachtree St", city: "Atlanta", state: "GA", zip: "30303", country: "USA", stars: 4, price: 120 },
  { id: 2, name: "Hilton Downtown", address: "720 S Michigan Ave", city: "Chicago", state: "IL", zip: "60605", country: "USA", stars: 5, price: 210 },
];

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });

/**
 * Captcha challenge store — stands in for the server-side session Kaptcha would
 * use. The answer stays here (never sent to the client); the SVG image carries
 * the text visually. Real deployment: replace with a `/captcha/*` API (or a
 * managed provider like Turnstile) — no Qloom-side change.
 */
const captchaAnswers = new Map<string, string>();
let captchaSeq = 0;

/**
 * Confirmed-bookings store — stands in for Tapestry's Hibernate-backed
 * `Booking` table queried by `YourBookings` via `CrudServiceDAO`. A real
 * deployment replaces this with a `/bookings` API; no Qloom-side change.
 */
interface StoredBooking {
  id: number;
  username: string;
  hotel: Hotel;
  checkinDate: string;
  checkoutDate: string;
}
const bookingsStore: StoredBooking[] = [];
let bookingSeq = 0;

function randomCaptchaText(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no easily-confused chars
  let out = "";
  for (let i = 0; i < 5; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

/** A data-URI SVG rendering the challenge text (the "distorted image"). */
function captchaImage(text: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="44">` +
    `<rect width="140" height="44" fill="#eee"/>` +
    `<text x="12" y="31" font-family="monospace" font-size="26" letter-spacing="4" fill="#333">${text}</text>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** A mock `fetch` implementing the OpenAPI endpoints from seed data. */
function mockFetch(): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), "http://localhost");
    const path = url.pathname.replace(/^\/api/, "");
    const method = init?.method ?? "GET";

    if (path === "/auth/signin" && method === "POST") {
      const body = JSON.parse(String(init?.body ?? "{}"));
      const user = USERS.find((u) => u.username === body.username && u.password === body.password);
      if (!user) return json({ error: "bad credentials" }, 401);
      const { password: _pw, ...safe } = user;
      return json(safe);
    }

    const byId = path.match(/^\/hotels\/(\d+)$/);
    if (byId && method === "GET") {
      const hotel = HOTELS.find((h) => h.id === Number(byId[1]));
      return hotel ? json(hotel) : json({ error: "not found" }, 404);
    }
    if (path === "/hotels" && method === "GET") {
      return json(HOTELS);
    }

    if (path === "/bookings" && method === "GET") {
      const username = url.searchParams.get("username");
      return json(bookingsStore.filter((b) => b.username === username));
    }
    if (path === "/bookings" && method === "POST") {
      const body = JSON.parse(String(init?.body ?? "{}"));
      const hotel = HOTELS.find((h) => h.id === Number(body.hotelId));
      if (!hotel) return json({ error: "unknown hotel" }, 400);
      const record: StoredBooking = {
        id: ++bookingSeq,
        username: String(body.username),
        hotel,
        checkinDate: String(body.checkinDate),
        checkoutDate: String(body.checkoutDate),
      };
      bookingsStore.push(record);
      return json(record, 201);
    }
    const bookingId = path.match(/^\/bookings\/(\d+)$/);
    if (bookingId && method === "DELETE") {
      const i = bookingsStore.findIndex((b) => b.id === Number(bookingId[1]));
      if (i >= 0) bookingsStore.splice(i, 1);
      return json({ ok: true });
    }

    if (path === "/captcha/new" && method === "GET") {
      const text = randomCaptchaText();
      const id = `cap-${++captchaSeq}`;
      captchaAnswers.set(id, text);
      return json({ id, image: captchaImage(text) }); // answer stays server-side
    }
    if (path === "/captcha/verify" && method === "POST") {
      const body = JSON.parse(String(init?.body ?? "{}"));
      const expected = captchaAnswers.get(String(body.id));
      const valid = expected != null && String(body.answer).toUpperCase() === expected;
      if (valid) captchaAnswers.delete(String(body.id)); // single-use
      return json({ valid });
    }

    return json({ error: "no route" }, 404);
  }) as typeof fetch;
}

Data.configureData({ baseUrl: "/api", fetch: mockFetch() });

/** The Tapestry `Authenticator` analogue, backed by the generated client. */
let loggedIn: User | null = null;

export const authenticator = {
  isLoggedIn: (): boolean => loggedIn !== null,
  getLoggedUser: (): User | null => loggedIn,
  logout: (): void => {
    loggedIn = null;
  },
  /** Throws on bad credentials (Tapestry: AuthenticationException). */
  async login(username: string, password: string): Promise<User> {
    try {
      loggedIn = await bookingApi.authenticate({ username, password });
      return loggedIn;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) throw new Error("Invalid username or password");
      throw err;
    }
  },
};
