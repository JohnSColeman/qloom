import { PHASES } from "@qloom/core";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Map a render phase to the method that implements it, on a prototype (used by
 *  the phase-annotation decorators). */
export function registerPhase(target: object, phase: string, method: string): void {
  const proto = target as any;
  const map: Record<string, string> = Object.prototype.hasOwnProperty.call(proto, PHASES)
    ? proto[PHASES]
    : (proto[PHASES] = { ...(proto[PHASES] ?? {}) });
  map[phase] = method;
}
