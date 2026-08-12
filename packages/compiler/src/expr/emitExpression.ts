import type { ExprNode } from "../types.js";

/**
 * Emit a Tapestry PEL AST as a JS value expression over `instance` (the root)
 * and `pelRange` (the range helper). `used` collects the names of runtime
 * helpers the expression references so the caller can import them.
 */
export function emitExpression(node: ExprNode, used: Set<string>): string {
  switch (node.kind) {
    case "literal":
      return typeof node.value === "string" ? JSON.stringify(node.value) : String(node.value);
    case "this":
      return "instance";
    case "prop": {
      const owner = node.object ? emitExpression(node.object, used) : "instance";
      return `${owner}${node.safe ? "?." : "."}${node.name}`;
    }
    case "invoke": {
      const owner = node.object ? emitExpression(node.object, used) : "instance";
      const args = node.args.map((a) => emitExpression(a, used)).join(", ");
      return `${owner}${node.safe ? "?." : "."}${node.name}(${args})`;
    }
    case "list":
      return `[${node.items.map((it) => emitExpression(it, used)).join(", ")}]`;
    case "map": {
      const entries = node.entries
        .map((e) => `[${emitExpression(e.key, used)}, ${emitExpression(e.value, used)}]`)
        .join(", ");
      return `new Map([${entries}])`;
    }
    case "range":
      used.add("pelRange");
      return `pelRange(${emitExpression(node.from, used)}, ${emitExpression(node.to, used)})`;
    case "not":
      return `!(${emitExpression(node.operand, used)})`;
  }
}
