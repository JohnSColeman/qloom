import { test } from "node:test";
import assert from "node:assert/strict";
import { parseExpression } from "../dist/expr/parseExpression.js";

test("bare identifier is a root property", () => {
  assert.deepEqual(parseExpression("name"), { kind: "prop", object: null, name: "name", safe: false });
});

test("property chain nests left-to-right", () => {
  assert.deepEqual(parseExpression("a.b"), {
    kind: "prop",
    object: { kind: "prop", object: null, name: "a", safe: false },
    name: "b",
    safe: false,
  });
});

test("safe deref sets the flag", () => {
  assert.equal(parseExpression("a?.b").safe, true);
});

test("method invocation with args", () => {
  const ast = parseExpression("roles.contains('admin')");
  assert.equal(ast.kind, "invoke");
  assert.equal(ast.name, "contains");
  assert.deepEqual(ast.args, [{ kind: "literal", value: "admin" }]);
});

test("keywords and constants", () => {
  assert.deepEqual(parseExpression("true"), { kind: "literal", value: true });
  assert.deepEqual(parseExpression("null"), { kind: "literal", value: null });
  assert.deepEqual(parseExpression("this"), { kind: "this" });
  assert.deepEqual(parseExpression("42"), { kind: "literal", value: 42 });
  assert.deepEqual(parseExpression("3.5"), { kind: "literal", value: 3.5 });
});

test("list, map, range, not", () => {
  assert.deepEqual(parseExpression("[a, 1]").kind, "list");
  assert.deepEqual(parseExpression("{k: v}").kind, "map");
  assert.deepEqual(parseExpression("1..10"), {
    kind: "range",
    from: { kind: "literal", value: 1 },
    to: { kind: "literal", value: 10 },
  });
  assert.deepEqual(parseExpression("!active").kind, "not");
});

test("trailing garbage throws", () => {
  assert.throws(() => parseExpression("a b"), /expected end/i);
});
