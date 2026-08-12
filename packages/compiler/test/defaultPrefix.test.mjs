import { test } from "node:test";
import assert from "node:assert/strict";
import { compileTemplate } from "../dist/compileTemplate.js";

// A bare single identifier is prefix-ambiguous — it is emitted as a
// resolveDefaultPrefix(...) call so the child component's declared
// @Parameter({ defaultPrefix }) decides prop-vs-literal at render time. Anything
// unambiguously an expression (paths, calls, operators, keywords) stays prop.

test("a bare identifier param is wrapped in resolveDefaultPrefix (prop + literal fallback)", () => {
  const { code } = compileTemplate('<t:x t:mode="cancel"/>', { name: "T" });
  assert.match(code, /"mode": resolveDefaultPrefix\("x", "mode", \{/);
  assert.match(code, /, "cancel"\)/); // the literal fallback string
});

test("a dotted path is a plain prop conduit, not wrapped", () => {
  const { code } = compileTemplate('<t:x t:value="hotel.city"/>', { name: "T" });
  assert.doesNotMatch(code, /resolveDefaultPrefix/);
});

test("a method call is a plain prop conduit, not wrapped", () => {
  const { code } = compileTemplate("<t:x t:value=\"roles.includes('a')\"/>", { name: "T" });
  assert.doesNotMatch(code, /resolveDefaultPrefix/);
});

test("prop keywords (true/false/null/this) are not defaultPrefix literals", () => {
  for (const kw of ["true", "false", "null", "this"]) {
    const { code } = compileTemplate(`<t:x t:test="${kw}"/>`, { name: "T" });
    assert.doesNotMatch(code, /resolveDefaultPrefix/, `keyword ${kw} should not be wrapped`);
  }
});

test("an explicit literal: prefix bypasses resolveDefaultPrefix", () => {
  const { code } = compileTemplate('<t:x t:mode="literal:cancel"/>', { name: "T" });
  assert.doesNotMatch(code, /resolveDefaultPrefix/);
  assert.match(code, /"mode": \{ get: \(\) => "cancel" \}/);
});

test("an explicit prop: prefix bypasses resolveDefaultPrefix", () => {
  const { code } = compileTemplate('<t:x t:mode="prop:something"/>', { name: "T" });
  assert.doesNotMatch(code, /resolveDefaultPrefix/);
});

test("a built-in LITERAL_PARAMS param stays a compile-time literal (not wrapped)", () => {
  // submit.mode is in LITERAL_PARAMS — resolved at compile time, no runtime call.
  const { code } = compileTemplate('<input t:type="submit" t:mode="cancel"/>', { name: "T" });
  assert.doesNotMatch(code, /resolveDefaultPrefix/);
  assert.match(code, /"mode": \{ get: \(\) => "cancel" \}/);
});
