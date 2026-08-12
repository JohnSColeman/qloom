/**
 * Component-tree event bubbling: events climb the container chain (not the DOM)
 * until a handler returns.
 */
import { CONTAINER, COMPONENT_ID, ON_EVENT } from "./symbols.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface OnEventEntry {
  event: string;
  component?: string;
  method: string;
}

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

function resolveHandler(container: any, event: string, id?: string): ((ctx: unknown) => unknown) | undefined {
  const names: string[] = [];
  if (id) names.push(`on${cap(event)}From${cap(id)}`);
  names.push(`on${cap(event)}`);
  for (const name of names) {
    if (typeof container[name] === "function") return (ctx) => container[name](ctx);
  }
  const map: OnEventEntry[] | undefined = container[ON_EVENT];
  if (map) {
    for (const e of map) {
      const eventMatch = e.event.toLowerCase() === event.toLowerCase();
      const compMatch = !e.component || (id && e.component.toLowerCase() === id.toLowerCase());
      if (eventMatch && compMatch && typeof container[e.method] === "function") {
        return (ctx) => container[e.method](ctx);
      }
    }
  }
  return undefined;
}

/**
 * Trigger a component event. Bubbles up the container chain until a handler
 * returns; the handler's return value is passed back to the caller.
 */
export function triggerEvent(component: object, event: string, context?: unknown): unknown {
  let container: any = (component as any)[CONTAINER];
  let id: string | undefined = (component as any)[COMPONENT_ID];
  while (container) {
    const handler = resolveHandler(container, event, id);
    if (handler) return handler(context);
    id = container[COMPONENT_ID];
    container = container[CONTAINER];
  }
  return undefined;
}
