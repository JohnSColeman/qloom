import { Environment } from "@qloom/core";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Injects an ambient value from the {@link Environment} — a value an ancestor
 * component pushed for `token`, read afresh on each access. Tapestry:
 * `@Environmental`. The field is read-only; by default it is **required** (a
 * missing environmental throws, listing what is available), matching Tapestry's
 * `@Environmental` default. Pass `{ required: false }` for Tapestry's
 * `@Environmental(false)` — the field then resolves to `null` when absent.
 *
 * `token` is the environment key: a class constructor standing in for its type
 * (the faithful analogue of Tapestry's `Class` key), a string, or a symbol.
 * Usable on any component, page, or mixin — the primary way a **mixin** reaches
 * a service published by an ancestor it holds no reference to.
 */
export function Environmental(token: unknown, options?: { required?: boolean }) {
  const required = options?.required ?? true;
  return function (target: object, key: string): void {
    Object.defineProperty(target, key, {
      configurable: true,
      enumerable: true,
      get(): any {
        return required ? Environment.peekRequired(token) : Environment.peek(token);
      },
    });
  };
}
