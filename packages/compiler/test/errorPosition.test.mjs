import { test } from "node:test";
import assert from "node:assert/strict";
import { compileTemplate } from "../dist/compileTemplate.js";

function fails(src) {
  try {
    compileTemplate(src, { name: "Tpl" });
    return null;
  } catch (e) {
    return e;
  }
}

test("a PEL error reports 1-based line:col in the message and as fields", () => {
  const err = fails("<div>\n  <p>ok</p>\n  <p>${a b c}</p>\n</div>");
  assert.ok(err, "should throw");
  assert.match(err.message, /^Tpl:3:\d+: /); // located on line 3
  assert.equal(err.line, 3);
  assert.equal(typeof err.column, "number");
});

test("an unsupported expansion prefix is located", () => {
  const err = fails("<p>${bogus:x}</p>");
  assert.ok(err);
  assert.match(err.message, /^Tpl:1:\d+: unsupported expansion prefix "bogus:"/);
  assert.equal(err.line, 1);
});

test("a formal-binding error points at the element's line", () => {
  // t:source forces a formal param; "a b" is not valid PEL → error at the element.
  const err = fails('<div>\n  <p>fine</p>\n  <t:loop t:source="a b"/>\n</div>');
  assert.ok(err);
  assert.match(err.message, /^Tpl:3:\d+: /);
  assert.equal(err.line, 3);
});
