import { test } from "node:test";
import assert from "node:assert/strict";
import { parseProperties } from "../dist/parseProperties.js";

test("parses basic key=value pairs", () => {
  assert.deepEqual(parseProperties("a=1\nb=two"), { a: "1", b: "two" });
});

test("accepts ':' and whitespace as separators", () => {
  assert.deepEqual(parseProperties("a:1\nb  two\nc = three"), { a: "1", b: "two", c: "three" });
});

test("ignores # and ! comment lines and blanks", () => {
  const src = "# a comment\n! also a comment\n\n  greeting = Hello  ";
  assert.deepEqual(parseProperties(src), { greeting: "Hello  " });
});

test("trims leading whitespace and the whitespace after the separator", () => {
  assert.deepEqual(parseProperties("   key   =   value"), { key: "value" });
});

test("handles backslash line continuations", () => {
  const src = "tagline = Welcome \\\n  to Qloom";
  assert.deepEqual(parseProperties(src), { tagline: "Welcome to Qloom" });
});

test("decodes \\uXXXX and \\n \\t escapes", () => {
  assert.deepEqual(parseProperties("x = caf\\u00e9\\nline2\\ttab"), { x: "café\nline2\ttab" });
});

test("honours escaped separators in the key", () => {
  assert.deepEqual(parseProperties("a\\=b = value"), { "a=b": "value" });
});

test("later files/lines win on duplicate keys (last assignment)", () => {
  assert.deepEqual(parseProperties("k=first\nk=second"), { k: "second" });
});

test("empty input is an empty catalogue", () => {
  assert.deepEqual(parseProperties(""), {});
});
