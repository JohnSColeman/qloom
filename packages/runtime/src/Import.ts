import { IMPORTS } from "@qloom/core";
import type { ImportSpec } from "./types.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tapestry's @Import, ported for client-side assets. A class decorator declaring
 * the stylesheets/libraries the component/page needs; the engine injects them
 * into <head> once, deduped, at render time (Assets.process, from driveInstance —
 * Tapestry's SetupRender timing). Field names match Tapestry's annotation.
 * `module`/`esModule`/`stack` are reserved for later and currently ignored.
 */
export function Import(spec: ImportSpec) {
  return function (ctor: Function): void {
    const proto = (ctor as any).prototype;
    const existing: ImportSpec = Object.prototype.hasOwnProperty.call(proto, IMPORTS)
      ? proto[IMPORTS]
      : (proto[IMPORTS] = {});
    for (const k of ["stylesheet", "library"] as const) {
      if (spec[k]) existing[k] = [...(existing[k] ?? []), ...spec[k]];
    }
  };
}
