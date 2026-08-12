import { CLASS_MIXINS } from "./symbols.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface MixinSpec {
  name: string;
  order: string[];
}

/**
 * Compute the ordered list of mixin names to attach to a component instance:
 * its **implementation mixins** (Tapestry `@Mixin`, collected up the prototype
 * chain, base classes first) followed by the **template mixins** (`t:mixins`),
 * then de-duplicated (a mixin attached twice is an error) and ordered by any
 * `before:`/`after:` constraints. Returns `[]` when there are none (the common
 * case — no walk cost beyond a couple of prototype hops).
 */
export function resolveMixins(instance: object, templateMixins?: string[], where = "component"): string[] {
  // Implementation mixins from the prototype chain. Each prototype's own list is
  // in declaration order; collect ancestors-first so base behavior leads.
  const chain: MixinSpec[][] = [];
  let proto = Object.getPrototypeOf(instance);
  while (proto && proto !== Object.prototype) {
    if (Object.prototype.hasOwnProperty.call(proto, CLASS_MIXINS)) {
      chain.push((proto as any)[CLASS_MIXINS] as MixinSpec[]);
    }
    proto = Object.getPrototypeOf(proto);
  }
  chain.reverse(); // ancestors first

  const specs: MixinSpec[] = [];
  for (const list of chain) for (const s of list) specs.push(s);
  for (const name of templateMixins ?? []) specs.push({ name, order: [] });

  if (specs.length === 0) return [];

  const seen = new Set<string>();
  for (const s of specs) {
    if (seen.has(s.name)) {
      throw new Error(`qloom: mixin "${s.name}" is attached more than once to ${where}.`);
    }
    seen.add(s.name);
  }

  return orderMixins(specs, where).map((s) => s.name);
}

/** Stable topological sort of mixin specs by `before:`/`after:` constraints
 *  (`before:*` / `after:*` mean before/after all others). Ties keep declaration
 *  order; a cycle is a fail-loud error. */
function orderMixins(specs: MixinSpec[], where: string): MixinSpec[] {
  const names = specs.map((s) => s.name);
  const index = new Map(names.map((n, i) => [n, i]));
  const after = new Map<string, Set<string>>(names.map((n) => [n, new Set<string>()])); // n -> nodes that come after n
  const indeg = new Map<string, number>(names.map((n) => [n, 0]));

  const edge = (before: string, target: string): void => {
    if (!index.has(before) || !index.has(target) || before === target) return;
    if (!after.get(before)!.has(target)) {
      after.get(before)!.add(target);
      indeg.set(target, (indeg.get(target) ?? 0) + 1);
    }
  };

  for (const s of specs) {
    for (const c of s.order ?? []) {
      const [kind, target] = c.split(":");
      if (kind === "before") {
        if (target === "*") names.forEach((n) => edge(s.name, n));
        else edge(s.name, target as string);
      } else if (kind === "after") {
        if (target === "*") names.forEach((n) => edge(n, s.name));
        else edge(target as string, s.name);
      }
    }
  }

  // Kahn's algorithm, keeping a queue sorted by original declaration index.
  const insert = (queue: string[], n: string): void => {
    let i = queue.length;
    while (i > 0 && (index.get(queue[i - 1] as string) ?? 0) > (index.get(n) ?? 0)) i--;
    queue.splice(i, 0, n);
  };
  const queue: string[] = [];
  names.filter((n) => (indeg.get(n) ?? 0) === 0).forEach((n) => insert(queue, n));

  const result: string[] = [];
  while (queue.length) {
    const n = queue.shift() as string;
    result.push(n);
    for (const t of after.get(n) ?? []) {
      indeg.set(t, (indeg.get(t) ?? 0) - 1);
      if ((indeg.get(t) ?? 0) === 0) insert(queue, t);
    }
  }
  if (result.length !== names.length) {
    throw new Error(`qloom: cyclic mixin ordering constraints on ${where}.`);
  }
  return result.map((n) => specs[index.get(n) as number] as MixinSpec);
}
