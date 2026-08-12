import { INFORMALS } from "./symbols.js";
import type { MarkupWriter } from "./types.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Render a component's host-form informal parameters onto the current element.
 *  Components that emit a single root element call this right after opening it. */
export function applyInformals(writer: MarkupWriter, instance: object): void {
  const informals = (instance as any)[INFORMALS] as Record<string, string> | undefined;
  if (!informals) return;
  for (const [name, value] of Object.entries(informals)) writer.attribute(name, value);
}
