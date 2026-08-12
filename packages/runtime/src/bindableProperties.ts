import { PROPS } from "./props-key.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Returns the set of @Property names registered for an instance. */
export function bindableProperties(instance: object): ReadonlySet<string | symbol> {
  return (instance as any)[PROPS] ?? new Set();
}
