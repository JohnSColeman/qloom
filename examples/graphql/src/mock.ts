/** A `fetch` that answers the SWAPI GraphQL endpoint from seed data — no server. */
const FILMS = [
  { title: "A New Hope", episodeID: 4, director: "George Lucas", releaseDate: "1977-05-25" },
  { title: "The Empire Strikes Back", episodeID: 5, director: "Irvin Kershner", releaseDate: "1980-05-17" },
  { title: "Return of the Jedi", episodeID: 6, director: "Richard Marquand", releaseDate: "1983-05-25" },
];

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });

export function mockFetch(): typeof fetch {
  return (async (_input: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? "{}")) as { query: string; variables?: Record<string, unknown> };

    // Error path: GetFilm for a non-existent id → a GraphQL errors array.
    if (/query GetFilm/.test(body.query)) {
      const id = body.variables?.["id"];
      return json({ data: { film: null }, errors: [{ message: `No film with id ${String(id)}` }] });
    }
    if (/query AllFilms/.test(body.query)) {
      return json({ data: { allFilms: { films: FILMS } } });
    }
    return json({ data: null, errors: [{ message: "unknown operation" }] });
  }) as typeof fetch;
}
