import { BINDINGS, CONTAINER, COMPONENT_ID } from "@qloom/core";
import type { Binding } from "@qloom/core";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Resolve a field's value target: the bound `value` param, else the container
 *  property named after the field's `t:id` (Tapestry's default). */
export function fieldTarget(field: any): Binding {
  const bound = field[BINDINGS]?.value as Binding | undefined;
  if (bound) return bound;
  const container = field[CONTAINER];
  const id = field[COMPONENT_ID] as string;
  return { get: () => container?.[id], set: (v) => { if (container) container[id] = v; } };
}
