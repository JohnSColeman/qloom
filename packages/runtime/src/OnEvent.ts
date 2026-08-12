import { ON_EVENT } from "@qloom/core";
import type { OnEventOptions } from "./types.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface OnEventEntry {
  event: string;
  component?: string;
  method: string;
}

/**
 * Marks a method as an event handler. Equivalent to the `on<Event>From<Id>` /
 * `on<Event>` naming convention, for cases where an explicit binding is clearer.
 */
export function OnEvent(options: OnEventOptions) {
  return function (target: object, key: string): void {
    const proto = target as any;
    const list: OnEventEntry[] = Object.prototype.hasOwnProperty.call(proto, ON_EVENT)
      ? proto[ON_EVENT]
      : (proto[ON_EVENT] = [...(proto[ON_EVENT] ?? [])]);
    const entry: OnEventEntry = options.component
      ? { event: options.value, component: options.component, method: key }
      : { event: options.value, method: key };
    list.push(entry);
  };
}
