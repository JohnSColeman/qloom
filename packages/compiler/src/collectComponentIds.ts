import { parseDocument } from "htmlparser2";

/** Minimal DOM node shape (mirrors compileTemplate's local view). */
interface Node {
  type: string;
  attribs?: Record<string, string>;
  children?: Node[];
}

/**
 * Collect every explicit `t:id` declared in a template. These are the component
 * ids an event can be fired from — the set that `on<Event>From<Id>` handlers and
 * `@OnEvent({ component })` must reference. Order-preserving, de-duplicated.
 */
export function collectComponentIds(tml: string): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  const walk = (nodes: Node[]): void => {
    for (const node of nodes) {
      const id = node.attribs?.["t:id"];
      if (id !== undefined && !seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
      if (node.children) walk(node.children);
    }
  };
  walk(parseDocument(tml, { xmlMode: true }).children as Node[]);
  return ids;
}
