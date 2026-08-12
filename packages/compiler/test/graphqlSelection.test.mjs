import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSchema, parse, Kind } from "graphql";
import { tsTypeForSelectionSet } from "../dist/tsTypeForSelectionSet.js";

const schema = buildSchema(`
  scalar DateTime
  enum Role { ADMIN USER }
  type Address { city: String! zip: String }
  type User {
    id: ID!
    name: String!
    role: Role
    createdAt: DateTime
    address: Address
    tags: [String!]!
  }
  type Query { user: User }
`);

function resolve(gqlType, selectionSource, scalars = {}) {
  const reg = { enums: new Map(), inputs: new Map(), scalars, warnings: [] };
  const doc = parse(`{ ${selectionSource} }`);
  const opSel = doc.definitions[0].selectionSet;
  const ctx = { schema, fragments: new Map(), reg };
  return { ts: tsTypeForSelectionSet(gqlType, opSel, ctx), reg };
}

const User = () => schema.getType("User");

test("scalars, non-null, and nullable fields", () => {
  const { ts } = resolve(User(), "id name role");
  assert.match(ts, /id: string/);
  assert.match(ts, /name: string/);
  assert.match(ts, /role: Role \| null/);
});

test("custom scalar field => unknown + warning", () => {
  const { ts, reg } = resolve(User(), "createdAt");
  assert.match(ts, /createdAt: unknown \| null/);
  assert.match(reg.warnings[0], /DateTime/);
});

test("nested object selection recurses", () => {
  const { ts } = resolve(User(), "address { city zip }");
  assert.match(ts, /address: \{ city: string; zip: string \| null \} \| null/);
});

test("list of non-null scalar", () => {
  const { ts } = resolve(User(), "tags");
  assert.match(ts, /tags: Array<string>/);
});

test("alias becomes the key; __typename is a string", () => {
  const { ts } = resolve(User(), "handle: name __typename");
  assert.match(ts, /handle: string/);
  assert.match(ts, /__typename: string/);
});

const abstractSchema = buildSchema(`
  interface Node { id: ID! }
  type User implements Node { id: ID! name: String! }
  type Bot implements Node { id: ID! label: String }
  union Actor = User | Bot
  type Query { node: Node actor: Actor }
`);

function resolveOn(schemaObj, gqlType, selectionSource) {
  const reg = { enums: new Map(), inputs: new Map(), scalars: {}, warnings: [] };
  const doc = parse(`{ ${selectionSource} }`);
  const ctx = { schema: schemaObj, fragments: new Map(), reg };
  return tsTypeForSelectionSet(gqlType, doc.definitions[0].selectionSet, ctx);
}

test("interface with inline fragments => discriminated union on __typename", () => {
  const ts = resolveOn(
    abstractSchema,
    abstractSchema.getType("Node"),
    "__typename id ... on User { name } ... on Bot { label }",
  );
  assert.match(ts, /\{ id: string; __typename: "User"; name: string \}/);
  assert.match(ts, /\{ id: string; __typename: "Bot"; label: string \| null \}/);
  assert.match(ts, /\|/); // union
});

test("union with inline fragments (no common fields except __typename)", () => {
  const ts = resolveOn(
    abstractSchema,
    abstractSchema.getType("Actor"),
    "__typename ... on User { name } ... on Bot { label }",
  );
  assert.match(ts, /__typename: "User"; name: string/);
  assert.match(ts, /__typename: "Bot"; label: string \| null/);
});
