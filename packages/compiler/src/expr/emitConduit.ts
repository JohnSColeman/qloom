import { emitExpression } from "./emitExpression.js";
import type { ExprNode } from "../types.js";

/**
 * Emit a `{ get, set? }` binding literal for a component parameter. A property
 * chain gets a two-way `set`; everything else (method call, literal, list, map,
 * range, not) is read-only. The `set` guards a null owner so assigning through a
 * null-safe chain is a no-op, matching Tapestry's set semantics.
 */
export function emitConduit(node: ExprNode, used: Set<string>): string {
  const get = emitExpression(node, used);
  if (node.kind !== "prop") return `{ get: () => (${get}) }`;
  const owner = node.object ? emitExpression(node.object, used) : "instance";
  return `{ get: () => (${get}), set: (v) => { const _o = ${owner}; if (_o != null) _o.${node.name} = v; } }`;
}
