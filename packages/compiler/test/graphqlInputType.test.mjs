import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSchema } from "graphql";
import { tsTypeForInputType } from "../dist/tsTypeForInputType.js";

const schema = buildSchema(`
  scalar DateTime
  enum Role { ADMIN USER }
  input UserFilter { role: Role name: String! tags: [String!] }
  type Query { _: String }
`);

function newReg(scalars = {}) {
  return { enums: new Map(), inputs: new Map(), scalars, warnings: [] };
}
const inputType = (name) => schema.getType(name);

test("built-in scalars map to TS, nullability adds | null", () => {
  const reg = newReg();
  // String (nullable) input field type:
  const field = schema.getType("UserFilter").getFields().name.type; // String!
  assert.equal(tsTypeForInputType(field, reg), "string");
});

test("enum registers a union and returns its name", () => {
  const reg = newReg();
  const roleType = schema.getType("UserFilter").getFields().role.type; // Role (nullable)
  assert.equal(tsTypeForInputType(roleType, reg), "Role | null");
  assert.equal(reg.enums.get("Role"), 'export type Role = "ADMIN" | "USER";');
});

test("list nullability composes", () => {
  const reg = newReg();
  const tags = schema.getType("UserFilter").getFields().tags.type; // [String!]
  assert.equal(tsTypeForInputType(tags, reg), "Array<string> | null");
});

test("input object registers an interface and returns its name", () => {
  const reg = newReg();
  assert.equal(tsTypeForInputType(inputType("UserFilter"), reg), "UserFilter | null");
  const decl = reg.inputs.get("UserFilter");
  assert.match(decl, /export interface UserFilter/);
  assert.match(decl, /role\?: Role \| null/);
  assert.match(decl, /name: string/);
  assert.match(decl, /tags\?: Array<string> \| null/);
});

test("unmapped custom scalar => unknown + warning", () => {
  const reg = newReg();
  const dt = schema.getType("DateTime");
  assert.equal(tsTypeForInputType(dt, reg), "unknown | null");
  assert.equal(reg.warnings.length, 1);
  assert.match(reg.warnings[0], /DateTime/);
});

test("scalars option overrides a custom scalar", () => {
  const reg = newReg({ DateTime: "string" });
  const dt = schema.getType("DateTime");
  assert.equal(tsTypeForInputType(dt, reg), "string | null");
  assert.equal(reg.warnings.length, 0);
});
