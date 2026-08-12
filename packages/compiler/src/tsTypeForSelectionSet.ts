/**
 * Resolve a GraphQL selection set (against its parent composite type) into a TS
 * type expression. Handles fields, aliases, `__typename`, nested objects, list /
 * non-null nullability, scalars, and enums. Interface/union inline-fragment
 * narrowing (→ discriminated union) is handled here via inline fragments.
 */
import { Kind, isNonNullType, isListType, isScalarType, isEnumType, isCompositeType } from "graphql";
import type {
  GraphQLSchema,
  GraphQLCompositeType,
  GraphQLOutputType,
  GraphQLObjectType,
  GraphQLInterfaceType,
  SelectionSetNode,
  FieldNode,
  FragmentDefinitionNode,
} from "graphql";
import type { GraphqlTypeRegistry } from "./types.js";
import { graphqlScalarToTs } from "./graphqlScalarToTs.js";
import { registerGraphqlEnum } from "./registerGraphqlEnum.js";

interface Ctx {
  schema: GraphQLSchema;
  fragments: Map<string, FragmentDefinitionNode>;
  reg: GraphqlTypeRegistry;
}

export function tsTypeForSelectionSet(
  parentType: GraphQLCompositeType,
  sel: SelectionSetNode,
  ctx: Ctx,
): string {
  const common: string[] = [];
  let typenameKey: string | null = null;
  const narrowings: Array<{ type: GraphQLCompositeType; sel: SelectionSetNode }> = [];

  for (const s of sel.selections) {
    if (s.kind === Kind.FIELD) {
      if (s.name.value === "__typename") typenameKey = s.alias?.value ?? "__typename";
      else common.push(fieldEntry(parentType, s, ctx));
    } else if (s.kind === Kind.INLINE_FRAGMENT) {
      const t = s.typeCondition
        ? (ctx.schema.getType(s.typeCondition.name.value) as GraphQLCompositeType)
        : parentType;
      if (t.name === parentType.name) {
        typenameKey = inlineFields(parentType, s.selectionSet, common, ctx) ?? typenameKey;
      } else {
        narrowings.push({ type: t, sel: s.selectionSet });
      }
    } else if (s.kind === Kind.FRAGMENT_SPREAD) {
      const frag = ctx.fragments.get(s.name.value);
      if (!frag) continue;
      const t = ctx.schema.getType(frag.typeCondition.name.value) as GraphQLCompositeType;
      if (t.name === parentType.name) {
        typenameKey = inlineFields(parentType, frag.selectionSet, common, ctx) ?? typenameKey;
      } else {
        narrowings.push({ type: t, sel: frag.selectionSet });
      }
    }
  }

  if (narrowings.length === 0) {
    const entries = [...common];
    if (typenameKey) entries.push(`${typenameKey}: string`);
    return `{ ${entries.join("; ")} }`;
  }

  // Discriminated union: one member per narrowing, merged with the common fields.
  return narrowings
    .map(({ type, sel: nsel }) => {
      const parts = [...common];
      if (typenameKey) parts.push(`${typenameKey}: ${JSON.stringify(type.name)}`);
      inlineFields(type, nsel, parts, ctx);
      return `{ ${parts.join("; ")} }`;
    })
    .join(" | ");
}

/** Push a nested selection's FIELD entries into `out`; return a __typename key if seen. */
function inlineFields(
  parent: GraphQLCompositeType,
  sel: SelectionSetNode,
  out: string[],
  ctx: Ctx,
): string | null {
  let typenameKey: string | null = null;
  for (const s of sel.selections) {
    if (s.kind === Kind.FIELD) {
      if (s.name.value === "__typename") typenameKey = s.alias?.value ?? "__typename";
      else out.push(fieldEntry(parent, s, ctx));
    }
  }
  return typenameKey;
}

function fieldEntry(parent: GraphQLCompositeType, field: FieldNode, ctx: Ctx): string {
  const key = field.alias?.value ?? field.name.value;
  const fields =
    "getFields" in parent ? (parent as GraphQLObjectType | GraphQLInterfaceType).getFields() : {};
  const def = fields[field.name.value];
  if (!def) return `${key}: unknown`;
  return `${key}: ${outputType(def.type, field.selectionSet, ctx)}`;
}

function outputType(
  type: GraphQLOutputType,
  selectionSet: SelectionSetNode | undefined,
  ctx: Ctx,
): string {
  if (isNonNullType(type)) return namedOrList(type.ofType as GraphQLOutputType, selectionSet, ctx);
  return `${namedOrList(type, selectionSet, ctx)} | null`;
}

function namedOrList(
  type: GraphQLOutputType,
  selectionSet: SelectionSetNode | undefined,
  ctx: Ctx,
): string {
  if (isListType(type)) return `Array<${outputType(type.ofType as GraphQLOutputType, selectionSet, ctx)}>`;
  if (isScalarType(type)) return graphqlScalarToTs(type.name, ctx.reg);
  if (isEnumType(type)) return registerGraphqlEnum(type, ctx.reg);
  if (isCompositeType(type)) {
    if (!selectionSet) return "unknown";
    return tsTypeForSelectionSet(type, selectionSet, ctx);
  }
  return "unknown";
}
