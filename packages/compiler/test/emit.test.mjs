import { test } from "node:test";
import assert from "node:assert/strict";
import { parseExpression } from "../dist/expr/parseExpression.js";
import { emitExpression } from "../dist/expr/emitExpression.js";

const pelRange = (a, b) => {
  const r = [];
  if (a <= b) for (let i = a; i <= b; i++) r.push(i);
  else for (let i = a; i >= b; i--) r.push(i);
  return r;
};

function run(src, instance) {
  const used = new Set();
  const code = emitExpression(parseExpression(src), used);
  return { value: new Function("instance", "pelRange", `return (${code});`)(instance, pelRange), used };
}

test("property chain", () => {
  assert.equal(run("hotel.city", { hotel: { city: "Paris" } }).value, "Paris");
});

test("safe deref short-circuits", () => {
  assert.equal(run("hotel?.city", { hotel: null }).value, undefined);
});

test("this is the root instance", () => {
  assert.equal(run("this.name", { name: "x" }).value, "x");
});

test("method invocation", () => {
  assert.equal(run("roles.includes('admin')", { roles: ["admin"] }).value, true);
});

test("literals, not, list, map", () => {
  assert.equal(run("true", {}).value, true);
  assert.equal(run("!active", { active: false }).value, true);
  assert.deepEqual(run("[a, 2]", { a: 1 }).value, [1, 2]);
  // The map key `k` is a property chain (per Tapestry's grammar: keyword |
  // constant | propertyChain), so it emits `instance.k`, not the literal
  // string "k". The instance must supply `k` as the actual key value.
  const m = run("{k: v}", { k: "key", v: 9 }).value;
  assert.ok(m instanceof Map);
  assert.equal(m.get("key"), 9);
});

test("range emits pelRange and flags the helper", () => {
  const { value, used } = run("1..3", {});
  assert.deepEqual(value, [1, 2, 3]);
  assert.ok(used.has("pelRange"));
});

test("a descending range counts down", () => {
  assert.deepEqual(run("3..1", {}).value, [3, 2, 1]);
});
