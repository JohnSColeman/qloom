import type { Hotel, User } from "../dal/BookingApi";

/** Seed data standing in for the database (what M5's mock backend serves). */
const HOTELS: Hotel[] = [
  { id: 1, name: "Marriott Courtyard", address: "125 Peachtree St", city: "Atlanta", state: "GA", zip: "30303", country: "USA", stars: 4, price: 120 },
  { id: 2, name: "Hilton Downtown", address: "720 S Michigan Ave", city: "Chicago", state: "IL", zip: "60605", country: "USA", stars: 5, price: 210 },
  { id: 3, name: "Hôtel Rouge", address: "5 Rue de Rivoli", city: "Paris", country: "France", stars: 3, price: 95 },
];

const USERS: User[] = [{ id: 1, username: "john", fullname: "John Coleman", email: "john@example.com" }];

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });

/** A `fetch` that serves the OpenAPI endpoints from seed data — no server. */
export function mockFetch(): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), "http://localhost");
    const path = url.pathname.replace(/^\/api/, "");
    const method = init?.method ?? "GET";

    const byId = path.match(/^\/hotels\/(\d+)$/);
    if (byId && method === "GET") {
      const hotel = HOTELS.find((h) => h.id === Number(byId[1]));
      return hotel ? json(hotel) : json({ error: "not found" }, 404);
    }
    if (path === "/hotels" && method === "GET") {
      const name = url.searchParams.get("name")?.toLowerCase();
      return json(name ? HOTELS.filter((h) => h.name.toLowerCase().includes(name)) : HOTELS);
    }
    if (path === "/auth/signin" && method === "POST") {
      const body = JSON.parse(String(init?.body ?? "{}"));
      const user = USERS.find((u) => u.username === body.username);
      return user ? json(user) : json({ error: "bad credentials" }, 401);
    }
    return json({ error: "no route" }, 404);
  }) as typeof fetch;
}
