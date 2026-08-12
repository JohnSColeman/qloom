import { PROPS } from "./props-key.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Register a bindable property name on a prototype (used by @Property and
 *  @SessionState, which is also a bindable property). */
export function registerProperty(prototype: object, key: string | symbol): void {
  const proto = prototype as any;
  const inherited = Object.getPrototypeOf(proto)?.[PROPS];
  const own: Set<string | symbol> = Object.prototype.hasOwnProperty.call(proto, PROPS)
    ? proto[PROPS]
    : (proto[PROPS] = new Set(inherited ?? []));
  own.add(key);
}
