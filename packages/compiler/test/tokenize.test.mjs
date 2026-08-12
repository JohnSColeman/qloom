import { test } from "node:test";
import assert from "node:assert/strict";
import { tokenizeExpression } from "../dist/expr/tokenizeExpression.js";

const kinds = (src) => tokenizeExpression(src).map((t) => t.type);

test("property chain with safe deref", () => {
  assert.deepEqual(kinds("user?.name"), ["identifier", "safederef", "identifier", "eof"]);
});

test("method call", () => {
  assert.deepEqual(kinds("roles.contains('admin')"), [
    "identifier", "deref", "identifier", "lparen", "string", "rparen", "eof",
  ]);
  assert.equal(tokenizeExpression("'admin'")[0].value, "admin"); // quotes stripped
});

test("keywords are case-insensitive", () => {
  assert.deepEqual(kinds("TRUE"), ["true", "eof"]);
  assert.deepEqual(kinds("this"), ["this", "eof"]);
});

test("integer range vs decimal", () => {
  assert.deepEqual(kinds("1..10"), ["integer", "range", "integer", "eof"]);
  assert.deepEqual(kinds("3.14"), ["decimal", "eof"]);
  assert.equal(tokenizeExpression("-5")[0].type, "integer");
  assert.equal(tokenizeExpression("-5")[0].value, "-5");
});

test("signed leading-dot decimals", () => {
  assert.deepEqual(kinds("-.5"), ["decimal", "eof"]);
  assert.equal(tokenizeExpression("-.5")[0].value, "-.5");
  assert.deepEqual(kinds("+.5"), ["decimal", "eof"]);
  assert.equal(tokenizeExpression("+.5")[0].value, "+.5");
  // Range operator is unaffected by the signed-decimal branch.
  assert.deepEqual(kinds("3..5"), ["integer", "range", "integer", "eof"]);
});

test("list and map punctuation", () => {
  assert.deepEqual(kinds("[a,b]"), [
    "lbracket", "identifier", "comma", "identifier", "rbracket", "eof",
  ]);
  assert.deepEqual(kinds("{k:v}"), [
    "lbrace", "identifier", "colon", "identifier", "rbrace", "eof",
  ]);
});

test("unexpected character throws", () => {
  assert.throws(() => tokenizeExpression("a@b"), /unexpected/);
});
