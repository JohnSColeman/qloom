import { VALIDATE_SPEC } from "@qloom/core";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Tapestry's @Validate: declares a validator spec (e.g. "required,minlength=3")
 *  on a page/component property. Stored as prototype metadata (like @Property /
 *  @Persist); the field reads it at render via its bound property name. */
export function Validate(spec: string) {
  return function (target: object, key: string | symbol): void {
    const proto = target as any;
    const map: Record<string, string> = Object.prototype.hasOwnProperty.call(proto, VALIDATE_SPEC)
      ? proto[VALIDATE_SPEC]
      : (proto[VALIDATE_SPEC] = { ...(proto[VALIDATE_SPEC] ?? {}) });
    map[String(key)] = spec;
  };
}
