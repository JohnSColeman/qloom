import { test } from "node:test";
import assert from "node:assert/strict";
import { parseExpression } from "../dist/expr/parseExpression.js";
import { emitConduit } from "../dist/expr/emitConduit.js";

function conduit(src) {
  const code = emitConduit(parseExpression(src), new Set());
  return new Function("instance", `return (${code});`);
}

test("property chain is two-way", () => {
  const inst = { criteria: { query: "a" } };
  const b = conduit("criteria.query")(inst);
  assert.equal(b.get(), "a");
  b.set("b");
  assert.equal(inst.criteria.query, "b");
});

test("root property is two-way", () => {
  const inst = { username: "" };
  const b = conduit("username")(inst);
  b.set("neo");
  assert.equal(inst.username, "neo");
});

test("method call is read-only (no set)", () => {
  const b = conduit("fullName()")({ fullName: () => "Ada" });
  assert.equal(b.get(), "Ada");
  assert.equal(b.set, undefined);
});

test("literal is read-only", () => {
  assert.equal(conduit("true")({}).set, undefined);
});

test("set through a null-safe chain is a no-op", () => {
  const inst = { a: null };
  const b = conduit("a?.b")(inst);
  assert.doesNotThrow(() => b.set(5));
  assert.equal(inst.a, null);
});
