import { BINDINGS, STORAGE, PARAMS, COMPONENT_ID, CONTAINER } from "@qloom/core";
import { evaluateDefaultValue } from "./evaluateDefaultValue.js";
import type { ParameterOptions } from "./types.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Declares a component input parameter. When the engine has installed a binding
 * for this name, reads/writes delegate to the container through it; when
 * unbound, the field behaves as ordinary per-instance storage (so field
 * initialisers act as defaults) — matching Tapestry's parameter semantics.
 */
export function Parameter(options: ParameterOptions = {}) {
  return function (target: object, key: string): void {
    const proto = target as any;
    const params: Record<string, ParameterOptions> = Object.prototype.hasOwnProperty.call(
      proto,
      PARAMS,
    )
      ? proto[PARAMS]
      : (proto[PARAMS] = { ...(proto[PARAMS] ?? {}) });
    params[key] = options;

    Object.defineProperty(proto, key, {
      configurable: true,
      enumerable: true,
      get(this: any) {
        const binding = this[BINDINGS]?.[key];
        if (!binding) {
          // Unbound: a field initializer (in STORAGE) wins; else the declared
          // `value` default binding expression; else undefined.
          const stored = this[STORAGE]?.[key];
          if (stored !== undefined) return stored;
          if (options.value !== undefined) {
            // A `prop:` default resolves against the container — the same context
            // a template binding (`t:param="x"`) would use.
            return evaluateDefaultValue(options.value, this[CONTAINER], options.defaultPrefix);
          }
          return undefined;
        }
        const value = binding.get();
        // `allowNull: false` — a bound parameter must not resolve to null.
        // The `value == null` gate keeps the common (non-null) read allocation-
        // and branch-free; only a null value consults the option.
        if (value == null && options.allowNull === false) {
          const where = this[COMPONENT_ID]
            ? `<${this.constructor.name} t:id="${this[COMPONENT_ID]}">`
            : `<${this.constructor.name}>`;
          throw new Error(
            `qloom: parameter "${key}" of ${where} must not be null (allowNull=false).`,
          );
        }
        return value;
      },
      set(this: any, value: any) {
        const binding = this[BINDINGS]?.[key];
        if (binding && binding.set) {
          binding.set(value);
          return;
        }
        (this[STORAGE] ?? (this[STORAGE] = {}))[key] = value;
      },
    });
  };
}
