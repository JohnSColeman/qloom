import { test } from "node:test";
import assert from "node:assert/strict";
import { compileTemplate } from "../dist/compileTemplate.js";

// On an element-form tag (<t:foo>), a bare attribute whose value is not a valid
// binding is an informal literal attribute — not a formal parameter compiled as
// PEL (which used to throw "expected end of expression").
test("element-form informal attr with a non-PEL value compiles as a literal (no throw)", () => {
  const { code } = compileTemplate('<t:textfield t:id="name" placeholder="Your name"/>', {
    name: "T",
  });
  assert.match(code, /"placeholder": "Your name"/);
});

test("non-identifier values (units, phrases) route to informal literals", () => {
  const { code } = compileTemplate('<t:any element="span" title="Book a room" size="20em"/>', {
    name: "T",
  });
  assert.match(code, /"title": "Book a room"/);
  assert.match(code, /"size": "20em"/);
});

test("a bare identifier value stays a formal binding, resolved by defaultPrefix", () => {
  const { code } = compileTemplate('<t:loop source="items" value="item"/>', { name: "T" });
  // source/value are formal bindings, not informal literal attributes. A bare
  // identifier is wrapped in resolveDefaultPrefix (prop by default; a child
  // declaring @Parameter defaultPrefix="literal" would take the raw string).
  assert.match(code, /"source": resolveDefaultPrefix\("loop", "source", \{/);
  assert.match(code, /"value": resolveDefaultPrefix\("loop", "value", \{/);
  assert.doesNotMatch(code, /"source": "items"/); // not an informal literal attribute
  assert.match(code, /import \{[^}]*resolveDefaultPrefix[^}]*\} from "@qloom\/core"/);
});

test("explicit prefixes and t: params remain formal", () => {
  const { code } = compileTemplate('<t:zone t:id="z" elementName="literal:div"/>', { name: "T" });
  assert.match(code, /"elementName": \{/); // literal-default formal param
});
