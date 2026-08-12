/**
 * GraphQL schema + app-authored operation documents → a typed client module
 * (build-time). Emits `export interface <Op>Variables`, `export type <Op>Result`
 * (the precise selected shape), a `<Op>_DOC` string, and an `api` object whose
 * methods call `@qloom/data`'s `Data.graphql`, returning `Either<GraphqlError, T>`.
 *
 * Uses graphql-js (a build-time dependency) — nothing GraphQL-related ships to the
 * browser. See PLAN §10.6: this takes the "arbitrary spec → use the library" branch
 * (unlike the hand-rolled OpenAPI generator, which authors a controlled subset).
 */
import { parse, buildASTSchema, validate, print, typeFromAST, Kind } from "graphql";
import type {
  DocumentNode,
  DefinitionNode,
  OperationDefinitionNode,
  FragmentDefinitionNode,
  SelectionSetNode,
  GraphQLInputType,
} from "graphql";
import type {
  GraphqlSource,
  GraphqlGenerateOptions,
  GraphqlGenerateResult,
  GraphqlTypeRegistry,
} from "./types.js";
import { tsTypeForInputType } from "./tsTypeForInputType.js";
import { tsTypeForSelectionSet } from "./tsTypeForSelectionSet.js";

export function generateGraphqlClient(
  sources: GraphqlSource[],
  options: GraphqlGenerateOptions = {},
): GraphqlGenerateResult {
  const typeDefs: DefinitionNode[] = [];
  const execDefs: DefinitionNode[] = [];
  for (const src of sources) {
    for (const def of parse(src.sdl).definitions) {
      if (def.kind === Kind.OPERATION_DEFINITION || def.kind === Kind.FRAGMENT_DEFINITION) {
        execDefs.push(def);
      } else {
        typeDefs.push(def);
      }
    }
  }
  if (typeDefs.length === 0) {
    throw new Error("qloom: no GraphQL schema (type definitions) found in the dal client directory");
  }

  const schema = buildASTSchema({ kind: Kind.DOCUMENT, definitions: typeDefs });

  const fragments = new Map<string, FragmentDefinitionNode>();
  const operations: OperationDefinitionNode[] = [];
  for (const def of execDefs) {
    if (def.kind === Kind.FRAGMENT_DEFINITION) fragments.set(def.name.value, def);
    else if (def.kind === Kind.OPERATION_DEFINITION) operations.push(def);
  }

  // Fail-loud pre-checks with Qloom-specific messages, *before* graphql-js's
  // generic `validate` (whose UniqueOperationNames rule would otherwise pre-empt
  // the "duplicate" message, etc.).
  const preSeen = new Set<string>();
  for (const op of operations) {
    if (!op.name) {
      throw new Error(
        "qloom: anonymous GraphQL operation; every operation must be named (the name becomes the client method)",
      );
    }
    if (preSeen.has(op.name.value)) {
      throw new Error(`qloom: duplicate GraphQL operation name "${op.name.value}"`);
    }
    preSeen.add(op.name.value);
    if (op.operation === "subscription") {
      throw new Error(`qloom: subscription "${op.name.value}" is not supported (no websocket transport)`);
    }
  }

  const execDoc: DocumentNode = { kind: Kind.DOCUMENT, definitions: execDefs };
  const validationErrors = validate(schema, execDoc);
  if (validationErrors.length > 0) {
    throw new Error(
      "qloom: GraphQL operation validation failed:\n  " +
        validationErrors.map((e) => e.message).join("\n  "),
    );
  }

  const reg: GraphqlTypeRegistry = {
    enums: new Map(),
    inputs: new Map(),
    scalars: options.scalars ?? {},
    warnings: [],
  };
  const ctx = { schema, fragments, reg };

  const opBlocks: string[] = [];
  const apiEntries: string[] = [];
  const seen = new Set<string>();

  for (const op of operations) {
    if (!op.name) {
      throw new Error(
        "qloom: anonymous GraphQL operation; every operation must be named (the name becomes the client method)",
      );
    }
    const name = op.name.value;
    if (seen.has(name)) throw new Error(`qloom: duplicate GraphQL operation name "${name}"`);
    seen.add(name);
    if (op.operation === "subscription") {
      throw new Error(`qloom: subscription "${name}" is not supported (no websocket transport)`);
    }

    const rootType = op.operation === "mutation" ? schema.getMutationType() : schema.getQueryType();
    if (!rootType) {
      throw new Error(`qloom: schema has no ${op.operation} root type (operation "${name}")`);
    }

    // Variables interface.
    const varFields: string[] = [];
    for (const v of op.variableDefinitions ?? []) {
      const gqlType = typeFromAST(schema, v.type) as GraphQLInputType | undefined;
      const required = v.type.kind === Kind.NON_NULL_TYPE;
      const ts = gqlType ? tsTypeForInputType(gqlType, reg) : "unknown";
      varFields.push(`  ${v.variable.name.value}${required ? "" : "?"}: ${ts};`);
    }
    const varsType = varFields.length
      ? `export interface ${name}Variables {\n${varFields.join("\n")}\n}`
      : `export type ${name}Variables = Record<string, never>;`;

    // Result type from the selection set.
    const resultType = tsTypeForSelectionSet(rootType, op.selectionSet, ctx);

    // Document string = operation + transitively referenced fragments.
    const usedFragments = new Set<string>();
    collectFragments(op.selectionSet, fragments, usedFragments);
    const docParts = [print(op), ...[...usedFragments].map((n) => print(fragments.get(n)!))];
    const docConst = `const ${name}_DOC = ${JSON.stringify(docParts.join("\n\n"))};`;

    opBlocks.push([varsType, `export type ${name}Result = ${resultType};`, docConst].join("\n"));
    apiEntries.push(
      `  ${name}: (variables: ${name}Variables): Promise<Either<GraphqlError, ${name}Result>> =>\n` +
        `    Data.graphql<${name}Result>(${name}_DOC, variables),`,
    );
  }

  const shared = [...reg.enums.values(), ...reg.inputs.values()].filter(Boolean);
  const code = [
    "// Generated by Qloom from a GraphQL schema — do not edit, not committed.",
    'import { Data, Either, GraphqlError } from "@qloom/data";',
    "",
    ...(shared.length ? [shared.join("\n"), ""] : []),
    ...opBlocks.flatMap((b) => [b, ""]),
    "export const api = {",
    ...apiEntries,
    "};",
    "",
  ].join("\n");

  return { code, warnings: [...new Set(reg.warnings)] };
}

/** Collect the names of fragments transitively referenced by a selection set. */
function collectFragments(
  sel: SelectionSetNode,
  fragments: Map<string, FragmentDefinitionNode>,
  acc: Set<string>,
): void {
  for (const s of sel.selections) {
    if (s.kind === Kind.FRAGMENT_SPREAD) {
      if (!acc.has(s.name.value)) {
        acc.add(s.name.value);
        const f = fragments.get(s.name.value);
        if (f) collectFragments(f.selectionSet, fragments, acc);
      }
    } else if (s.kind === Kind.FIELD) {
      if (s.selectionSet) collectFragments(s.selectionSet, fragments, acc);
    } else if (s.kind === Kind.INLINE_FRAGMENT) {
      collectFragments(s.selectionSet, fragments, acc);
    }
  }
}
