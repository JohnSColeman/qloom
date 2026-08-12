import { test } from "node:test";
import assert from "node:assert/strict";
import { GraphqlError } from "../dist/GraphqlError.js";

test("graphql() carries kind, joined message, errors, partial data", () => {
  const e = GraphqlError.graphql([{ message: "bad" }, { message: "worse" }], { x: 1 });
  assert.equal(e.kind, "graphql");
  assert.match(e.message, /bad/);
  assert.match(e.message, /worse/);
  assert.equal(e.errors.length, 2);
  assert.deepEqual(e.partialData, { x: 1 });
  assert.ok(e instanceof Error);
});

test("transport() carries kind, status, cause", () => {
  const cause = new Error("network");
  const e = GraphqlError.transport(503, cause);
  assert.equal(e.kind, "transport");
  assert.equal(e.status, 503);
  assert.equal(e.cause, cause);
  assert.match(e.message, /503/);
});

test("graphql() with empty errors still has a message", () => {
  const e = GraphqlError.graphql([], null);
  assert.equal(typeof e.message, "string");
  assert.ok(e.message.length > 0);
});
