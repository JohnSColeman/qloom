/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tapestry's `Environment` service: a render-scoped, token-keyed stack of
 * ambient values. A component `push`es a value while it renders its body and
 * `pop`s it afterward; any descendant — component or mixin — reads the current
 * top with `@Environmental`, however deeply nested, without the value being
 * threaded through parameters (Tapestry's answer to prop-drilling).
 *
 * Tapestry keys the stack by Java type; TypeScript types erase at runtime, so
 * the key is a **token** — any value usable as a Map key (a class constructor
 * standing in for its type, a string, or a symbol). Shared mutable state, so a
 * static class (module architecture rule 4). `peekRequired` fails loud, listing
 * what *is* available — mirroring Tapestry's `UnknownValueException`.
 */
export class Environment {
  private static stacks = new Map<unknown, unknown[]>();

  /** Push `value` for `token`; returns the value it shadows (or null). */
  static push<T>(token: unknown, value: T): T | null {
    let stack = Environment.stacks.get(token);
    if (!stack) Environment.stacks.set(token, (stack = []));
    const prev = stack.length ? (stack[stack.length - 1] as T) : null;
    stack.push(value);
    return prev;
  }

  /** Remove and return the top value for `token`; throws if the stack is empty. */
  static pop<T>(token: unknown): T {
    const stack = Environment.stacks.get(token);
    if (!stack || stack.length === 0) {
      throw new Error(`qloom: Environment.pop of an empty stack for ${Environment.describe(token)}.`);
    }
    return stack.pop() as T;
  }

  /** The current top value for `token`, or null if none. */
  static peek<T>(token: unknown): T | null {
    const stack = Environment.stacks.get(token);
    return stack && stack.length ? (stack[stack.length - 1] as T) : null;
  }

  /** The current top value for `token`; throws (listing available tokens) if none. */
  static peekRequired<T>(token: unknown): T {
    const value = Environment.peek<T>(token);
    if (value == null) {
      const available = [...Environment.stacks.entries()]
        .filter(([, stack]) => stack.length)
        .map(([t]) => Environment.describe(t));
      throw new Error(
        `qloom: no environmental for ${Environment.describe(token)} is available. ` +
          `Available: [${available.join(", ")}].`,
      );
    }
    return value;
  }

  private static describe(token: unknown): string {
    if (typeof token === "function") return token.name || "(anonymous class)";
    if (typeof token === "symbol") return token.toString();
    return String(token);
  }
}
