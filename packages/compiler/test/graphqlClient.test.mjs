import { test } from "node:test";
import assert from "node:assert/strict";
import { generateGraphqlClient } from "../dist/generateGraphqlClient.js";

const SCHEMA = `
  schema { query: Root, mutation: Mutations }
  scalar DateTime
  enum Role { ADMIN USER }
  interface Node { id: ID! }
  type User implements Node { id: ID! name: String! role: Role createdAt: DateTime }
  type Bot implements Node { id: ID! label: String }
  input UserFilter { role: Role name: String }
  type Root {
    user(id: ID!): User
    users(filter: UserFilter): [User!]!
    node(id: ID!): Node
  }
  type Mutations { rename(id: ID!, name: String!): User! }
`;
const OPS = `
  query GetUser($id: ID!) { user(id: $id) { id name role createdAt } }
  query FindUsers($filter: UserFilter) { users(filter: $filter) { id name } }
  query GetNode($id: ID!) { node(id: $id) { __typename id ... on User { name } ... on Bot { label } } }
  mutation Rename($id: ID!, $name: String!) { rename(id: $id, name: $name) { id name } }
`;
const gen = (schema = SCHEMA, ops = OPS, options) =>
  generateGraphqlClient([{ file: "schema.graphql", sdl: schema }, { file: "ops.graphql", sdl: ops }], options);

test("emits the runtime import and an api object", () => {
  const { code } = gen();
  assert.match(code, /import \{ Data, Either, GraphqlError \} from "@qloom\/data";/);
  assert.match(code, /export const api = \{/);
});

test("variables interfaces", () => {
  const { code } = gen();
  assert.match(code, /export interface GetUserVariables \{\s*id: string;\s*\}/);
  assert.match(code, /export interface RenameVariables \{[\s\S]*id: string;[\s\S]*name: string;[\s\S]*\}/);
  assert.match(code, /filter\?: UserFilter \| null/);
});

test("shared enum + input object emitted once", () => {
  const { code } = gen();
  assert.match(code, /export type Role = "ADMIN" \| "USER";/);
  assert.match(code, /export interface UserFilter \{/);
});

test("result types with nullability and custom scalar warning", () => {
  const { code, warnings } = gen();
  assert.match(code, /export type GetUserResult = \{ user: \{ id: string; name: string; role: Role \| null; createdAt: unknown \| null \} \| null \};/);
  assert.match(code, /export type FindUsersResult = \{ users: Array<\{ id: string; name: string \}> \};/);
  assert.ok(warnings.some((w) => /DateTime/.test(w)));
});

test("interface selection => discriminated union result", () => {
  const { code } = gen();
  assert.match(code, /GetNodeResult = [\s\S]*__typename: "User"; name: string/);
  assert.match(code, /__typename: "Bot"; label: string \| null/);
});

test("api entries call Data.graphql with the right types", () => {
  const { code } = gen();
  assert.match(code, /GetUser: \(variables: GetUserVariables\): Promise<Either<GraphqlError, GetUserResult>> =>/);
  assert.match(code, /Data\.graphql<GetUserResult>\(GetUser_DOC, variables\)/);
});

test("DOC constant is a JSON string containing the operation", () => {
  const { code } = gen();
  assert.match(code, /const GetUser_DOC = "query GetUser/);
});

test("scalars option refines a custom scalar and silences the warning", () => {
  const { code, warnings } = gen(SCHEMA, OPS, { scalars: { DateTime: "string" } });
  assert.match(code, /createdAt: string \| null/);
  assert.equal(warnings.length, 0);
});

test("throws on anonymous operation", () => {
  assert.throws(() => gen(SCHEMA, `query { user(id: "1") { id } }`), /anonymous/i);
});

test("throws on duplicate operation name", () => {
  assert.throws(
    () => gen(SCHEMA, `query A($id: ID!){ user(id:$id){id} } query A($id: ID!){ user(id:$id){name} }`),
    /duplicate/i,
  );
});

test("throws on subscription", () => {
  const s = SCHEMA.replace("mutation: Mutations", "mutation: Mutations, subscription: Subs") +
    "\ntype Subs { ping: String }";
  assert.throws(() => gen(s, `subscription S { ping }`), /subscription/i);
});

test("throws on an operation that fails schema validation", () => {
  assert.throws(() => gen(SCHEMA, `query Bad { user(id: "1") { nope } }`), /validation/i);
});

test("throws when no schema definitions are present", () => {
  assert.throws(
    () => generateGraphqlClient([{ file: "ops.graphql", sdl: `query Q { x }` }]),
    /no GraphQL schema/i,
  );
});
