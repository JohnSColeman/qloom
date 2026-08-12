import { BINDINGS, CONTAINER } from "@qloom/core";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Binds a **mixin** field to a parameter of its host component. Tapestry:
 * `@BindParameter`. The field becomes a two-way alias in the chain
 * `user-variable <=> mixin.field <=> host.param` — reading it reads the host's
 * parameter, writing it writes the host's parameter (propagating to whatever the
 * host bound). Pass one or more candidate host-parameter names; the first that
 * the host actually declares (has a binding for) wins. With no name, the mixin
 * field's own name is used (Tapestry's default, e.g. a field named `value`).
 *
 * Backed by the host bindings the mixin shares (`BINDINGS`, set on the mixin at
 * render time); when the named parameter is unbound it falls back to the host
 * instance property (`CONTAINER`).
 */
export function BindParameter(...names: string[]) {
  return function (target: object, key: string): void {
    const candidates = names.length ? names : [key];
    const fallback = candidates[0] as string; // candidates always has ≥1 entry
    const resolve = (self: any): string => {
      const b = self[BINDINGS];
      return candidates.find((n) => b?.[n]) ?? fallback;
    };
    Object.defineProperty(target, key, {
      configurable: true,
      enumerable: true,
      get(this: any) {
        const name = resolve(this);
        const binding = this[BINDINGS]?.[name];
        return binding ? binding.get() : this[CONTAINER]?.[name];
      },
      set(this: any, v: unknown) {
        const name = resolve(this);
        const binding = this[BINDINGS]?.[name];
        if (binding?.set) binding.set(v);
        else if (this[CONTAINER]) this[CONTAINER][name] = v;
      },
    });
  };
}
