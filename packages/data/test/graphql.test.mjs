import { test } from "node:test";
import assert from "node:assert/strict";
import { Data } from "../dist/Data.js";

const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });

// Each test fully sets config (config is static and persists across tests).
function withFetch(fn, { baseUrl = "", graphqlEndpoint } = {}) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), init });
    return fn(String(url), init);
  };
  // Pass graphqlEndpoint unconditionally (undefined resets it) — config is static
  // and configureData merges, so a truthy-only spread would leak across tests.
  Data.configureData({ baseUrl, fetch: fetchImpl, headers: () => ({}), graphqlEndpoint });
  return calls;
}

test("success resolves to Right(data)", async () => {
  withFetch(() => jsonResponse({ data: { hello: "world" } }));
  const result = await Data.graphql("query { hello }");
  assert.equal(result.isRight, true);
  assert.equal(result.fold(() => null, (d) => d.hello), "world");
});

test("errors array resolves to Left(graphql) with partial data", async () => {
  withFetch(() => jsonResponse({ data: { hello: null }, errors: [{ message: "boom" }] }));
  const result = await Data.graphql("query { hello }");
  assert.equal(result.isLeft, true);
  const err = result.fold((l) => l, () => null);
  assert.equal(err.kind, "graphql");
  assert.match(err.message, /boom/);
  assert.deepEqual(err.partialData, { hello: null });
});

test("non-2xx resolves to Left(transport) with status", async () => {
  withFetch(() => jsonResponse({ error: "nope" }, 500));
  const result = await Data.graphql("query { hello }");
  const err = result.fold((l) => l, () => null);
  assert.equal(err.kind, "transport");
  assert.equal(err.status, 500);
});

test("fetch throwing resolves to Left(transport)", async () => {
  withFetch(() => { throw new Error("network down"); });
  const result = await Data.graphql("query { hello }");
  const err = result.fold((l) => l, () => null);
  assert.equal(err.kind, "transport");
});

test("posts { query, variables } to baseUrl + graphqlEndpoint", async () => {
  const calls = withFetch(() => jsonResponse({ data: {} }), { baseUrl: "/api", graphqlEndpoint: "/gql" });
  await Data.graphql("query Q($id: ID!){ film }", { id: "1" });
  assert.equal(calls[0].url, "/api/gql");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(JSON.parse(calls[0].init.body), { query: "query Q($id: ID!){ film }", variables: { id: "1" } });
});

test("defaults endpoint to /graphql", async () => {
  const calls = withFetch(() => jsonResponse({ data: {} }));
  await Data.graphql("query { hello }");
  assert.equal(calls[0].url, "/graphql");
});
