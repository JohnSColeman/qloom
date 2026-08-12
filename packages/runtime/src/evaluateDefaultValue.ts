import { Messages } from "@qloom/core";

/* eslint-disable @typescript-eslint/no-explicit-any */

const PREFIX = /^([a-z]+):([\s\S]*)$/;
const KNOWN = new Set(["literal", "message", "prop"]);

/**
 * Evaluate an unbound parameter's default `value` binding expression against its
 * container. Supports the `literal:` / `message:` / `prop:` prefixes; a bare
 * expression uses the parameter's `defaultPrefix` (default `prop`). `prop:` walks
 * a (possibly dotted) property path on the container — Qloom has no runtime
 * property-expression engine, so method calls/operators in a `value` default are
 * not supported (use a field initializer or bind the parameter for those).
 */
export function evaluateDefaultValue(
  expr: string,
  container: any,
  defaultPrefix: "prop" | "literal" = "prop",
): unknown {
  const match = PREFIX.exec(expr);
  const prefixed = match !== null && KNOWN.has(match[1]!);
  const prefix = prefixed ? match![1]! : defaultPrefix;
  const rest = prefixed ? match![2]! : expr;

  if (prefix === "literal") return rest;
  if (prefix === "message") return Messages.message(rest);
  // prop: walk the dotted path on the container, bailing safely on null/undefined.
  return rest.split(".").reduce<any>((obj, key) => (obj == null ? undefined : obj[key.trim()]), container);
}
