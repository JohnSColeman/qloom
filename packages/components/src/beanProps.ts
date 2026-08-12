/* eslint-disable @typescript-eslint/no-explicit-any */

/** Resolve the ordered property list from `include`, else the object's own keys. */
export function beanProps(include: string, obj: any): string[] {
  const inc = include.split(",").map((s) => s.trim()).filter(Boolean);
  return inc.length ? inc : Object.keys(obj ?? {});
}
