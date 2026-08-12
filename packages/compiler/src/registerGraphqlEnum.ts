/** Register a GraphQL enum as a TS string-literal union; return its type name. */
import type { GraphQLEnumType } from "graphql";
import type { GraphqlTypeRegistry } from "./types.js";

export function registerGraphqlEnum(type: GraphQLEnumType, reg: GraphqlTypeRegistry): string {
  if (!reg.enums.has(type.name)) {
    const members = type.getValues().map((v) => JSON.stringify(v.name)).join(" | ");
    reg.enums.set(type.name, `export type ${type.name} = ${members};`);
  }
  return type.name;
}
