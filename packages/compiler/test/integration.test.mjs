import { test } from "node:test";
import assert from "node:assert/strict";
import { compileTemplate } from "../dist/compileTemplate.js";

const compile = (html) => compileTemplate(html, { name: "T" }).code;

test("method call in an expansion compiles", () => {
  const code = compile("<p>${user.fullName()}</p>");
  assert.match(code, /instance\.user\.fullName\(\)/);
});

test("range expansion imports pelRange", () => {
  const code = compile("<p>${1..pageCount}</p>");
  assert.match(code, /import \{[^}]*pelRange[^}]*\} from "@qloom\/core"/);
  assert.match(code, /pelRange\(1, instance\.pageCount\)/);
});

test("prop-default binding emits a two-way conduit", () => {
  const code = compile('<input t:type="textfield" t:id="q" t:value="criteria.query"/>');
  assert.match(code, /get: \(\) => \(instance\.criteria\.query\)/);
  assert.match(code, /set: \(v\) =>/);
});

test("message: binding resolves (was silently literal before)", () => {
  const code = compile('<t:mycomp label="message:hello"/>');
  assert.match(code, /Messages\.message\("hello"\)/);
});

test("literal-default param stays literal", () => {
  const code = compile('<a t:type="pagelink" t:page="search">go</a>');
  assert.match(code, /"page": \{ get: \(\) => "search" \}/);
});

test("a PEL syntax error names the template", () => {
  assert.throws(() => compile("<p>${a b c}</p>"), /T:.*expected end/i);
});
