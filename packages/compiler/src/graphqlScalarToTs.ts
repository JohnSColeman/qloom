/** Map a GraphQL scalar name to a TS type; unmapped custom scalars → `unknown` + warning. */
import type { GraphqlTypeRegistry } from "./types.js";

export function graphqlScalarToTs(name: string, reg: GraphqlTypeRegistry): string {
  switch (name) {
    case "Int":
    case "Float":
      return "number";
    case "String":
    case "ID":
      return "string";
    case "Boolean":
      return "boolean";
    default: {
      const mapped = reg.scalars[name];
      if (mapped) return mapped;
      reg.warnings.push(
        `unmapped custom scalar "${name}" typed as \`unknown\` (add it to graphqlScalars to refine)`,
      );
      return "unknown";
    }
  }
}
