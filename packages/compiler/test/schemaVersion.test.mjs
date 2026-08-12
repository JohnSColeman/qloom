// Version gates ported from Tapestry's SaxTemplateParser: the xmlns:t schema URI
// resolves to a template version that gates which t: directives are legal, and the
// `schemaVersion` option supplies the default when a template omits the namespace.
import { test } from "node:test";
import assert from "node:assert/strict";
import { compileTemplate } from "../dist/compileTemplate.js";

const compile = (html, options = {}) => compileTemplate(html, { name: "T", ...options }).code;
const throws = (html, options, re) =>
  assert.throws(() => compile(html, options), re);

const ns = (v) => `xmlns:t="http://tapestry.apache.org/schema/tapestry_${v}.xsd"`;

test("a recognized 5_4 namespace compiles ordinary structural directives", () => {
  const code = compile(`<t:container ${ns("5_4")}><t:body/></t:container>`);
  assert.match(code, /body\(writer\)/);
});

test("https scheme is accepted for the namespace URI", () => {
  const code = compile(`<html xmlns:t="https://tapestry.apache.org/schema/tapestry_5_4.xsd"><p>hi</p></html>`);
  assert.match(code, /writer\.text/);
});

test("an unrecognized Tapestry schema URI fails loud (recognition gate)", () => {
  throws(
    `<html xmlns:t="http://tapestry.apache.org/schema/tapestry_9_9.xsd"><p>x</p></html>`,
    {},
    /unrecognized Tapestry schema/i,
  );
});

test("a non-Tapestry xmlns:t URI fails loud", () => {
  throws(`<html xmlns:t="urn:bogus"><p>x</p></html>`, {}, /unrecognized Tapestry schema/i);
});

test("<t:parameter> is rejected as deprecated at >=5.3 (Tapestry-verbatim)", () => {
  throws(
    `<html ${ns("5_4")}><t:parameter name="x">y</t:parameter></html>`,
    {},
    /deprecated in Tapestry 5\.3 in favour of 'tapestry:parameter' namespace/,
  );
});

test("<t:parameter> below 5.3 is reported as unsupported classic parameter", () => {
  throws(
    `<html ${ns("5_1_0")}><t:parameter name="x">y</t:parameter></html>`,
    {},
    /classic <parameter>.*tapestry:parameter/i,
  );
});

test("a 5.1 inheritance directive under the 5_0_0 schema requires 5_1_0", () => {
  throws(
    `<html ${ns("5_0_0")}><t:remove>gone</t:remove></html>`,
    {},
    /requires the tapestry_5_1_0 schema/i,
  );
});

test("a recognized-but-unimplemented directive (>=5.1) fails as not-yet-supported", () => {
  throws(
    `<html ${ns("5_4")}><t:extend><t:replace id="a">x</t:replace></t:extend></html>`,
    {},
    /Qloom does not yet support/i,
  );
});

test("with no xmlns:t declared, the default schema version is 5.4", () => {
  // 5.4 → <t:remove> is a recognized directive → not-yet-supported (not a version error)
  throws(`<div><t:remove>x</t:remove></div>`, {}, /Qloom does not yet support/i);
});

test("schemaVersion option overrides the default when no xmlns:t is declared", () => {
  throws(`<div><t:remove>x</t:remove></div>`, { schemaVersion: "5.0" }, /requires the tapestry_5_1_0 schema/i);
});

test("a declared xmlns:t wins over the schemaVersion option default", () => {
  // option says 5.0 but the template declares 5_4 → directive recognized, not a version error
  throws(
    `<html ${ns("5_4")}><t:remove>x</t:remove></html>`,
    { schemaVersion: "5.0" },
    /Qloom does not yet support/i,
  );
});

test("an invalid schemaVersion option value fails loud", () => {
  throws(`<p>hi</p>`, { schemaVersion: "9.9" }, /invalid schemaVersion/i);
});
