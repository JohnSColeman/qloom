import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { generateDalClients } from "../dist/vite-plugin.js";

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "qloom-gql-"));
  const dir = path.join(root, "dal", "swapi");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "schema.graphql"),
    `schema { query: Root }
     type Film { title: String episodeID: Int }
     type Root { film(id: ID!): Film }`,
  );
  fs.writeFileSync(
    path.join(dir, "films.graphql"),
    `query GetFilm($id: ID!) { film(id: $id) { title episodeID } }`,
  );
  return root;
}

test("generates .qloom/dal/<dir>.ts from a graphql client directory", () => {
  const root = fixture();
  generateDalClients(root);
  const out = path.join(root, ".qloom", "dal", "swapi.ts");
  assert.ok(fs.existsSync(out), "swapi.ts generated");
  const code = fs.readFileSync(out, "utf8");
  assert.match(code, /GetFilm: \(variables: GetFilmVariables\)/);
  assert.match(code, /Data\.graphql<GetFilmResult>/);
});
