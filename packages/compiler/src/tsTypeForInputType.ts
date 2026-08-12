/**
 * Map a GraphQL input type (variable / input-object field type) to a TS type
 * expression, registering referenced enums and input objects into the registry.
 * Nullability follows GraphQL: `T!` → `T`, `T` → `T | null`, `[T!]` → `Array<T> | null`.
 */
import { isNonNullType, isListType, isScalarType, isEnumType, isInputObjectType } from "graphql";
import type { GraphQLInputType, GraphQLInputObjectType } from "graphql";
import type { GraphqlTypeRegistry } from "./types.js";
import { graphqlScalarToTs } from "./graphqlScalarToTs.js";
import { registerGraphqlEnum } from "./registerGraphqlEnum.js";

export function tsTypeForInputType(type: GraphQLInputType, reg: GraphqlTypeRegistry): string {
  if (isNonNullType(type)) return namedOrList(type.ofType as GraphQLInputType, reg);
  return `${namedOrList(type, reg)} | null`;
}

function namedOrList(type: GraphQLInputType, reg: GraphqlTypeRegistry): string {
  if (isListType(type)) return `Array<${tsTypeForInputType(type.ofType as GraphQLInputType, reg)}>`;
  if (isScalarType(type)) return graphqlScalarToTs(type.name, reg);
  if (isEnumType(type)) return registerGraphqlEnum(type, reg);
  if (isInputObjectType(type)) {
    registerInput(type, reg);
    return type.name;
  }
  return "unknown";
}

function registerInput(type: GraphQLInputObjectType, reg: GraphqlTypeRegistry): void {
  if (reg.inputs.has(type.name)) return;
  reg.inputs.set(type.name, ""); // reserve to break reference cycles
  const fields = Object.values(type.getFields()).map((f) => {
    const required = isNonNullType(f.type);
    return `${f.name}${required ? "" : "?"}: ${tsTypeForInputType(f.type, reg)}`;
  });
  reg.inputs.set(type.name, `export interface ${type.name} { ${fields.join("; ")} }`);
}
