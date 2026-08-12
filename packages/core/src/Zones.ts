import { DomMarkupWriter } from "./DomMarkupWriter.js";
import { ErrorReporter } from "./ErrorReporter.js";
import type { RenderBody } from "./types.js";

interface ZoneEntry {
  element: Element;
  render: RenderBody;
}

const REPLACE_ON_RECONCILE = "__qloomReplaceOnReconcile";

/**
 * Zones: re-render a subtree through a focus-preserving reconciler that patches
 * the DOM in place. Shared mutable state, so a static class (module
 * architecture rule 2).
 */
export class Zones {
  private static readonly zones = new Map<string, ZoneEntry>();

  static registerZone(id: string, element: Element, render: RenderBody): void {
    Zones.zones.set(id, { element, render });
  }

  static unregisterZone(id: string): void {
    Zones.zones.delete(id);
  }

  /** Drop all zone registrations — called by the Router on each page render,
   *  since replacing the mount detaches every previous page's zone element
   *  (otherwise the registry, holding live elements + render closures, grows
   *  unbounded across navigations). */
  static clear(): void {
    Zones.zones.clear();
  }

  /** Number of registered zones (diagnostics/tests). */
  static size(): number {
    return Zones.zones.size;
  }

  /** The live element a zone is registered under, or null. Lets a caller (e.g.
   *  the `ZoneRefresh` mixin) capture the exact node so a timer can self-clear
   *  when *that* node detaches — surviving navigation to a page that reuses the id. */
  static zoneElement(id: string): Element | null {
    return Zones.zones.get(id)?.element ?? null;
  }

  /**
   * Mark an element to be replaced *wholesale* (not patched in place) during
   * reconciliation. Needed for elements that carry imperatively-attached event
   * listeners (EventLink/PageLink click, Form submit): reconciliation copies
   * attributes but cannot transfer listeners, so a reused node would keep its
   * stale handler. Replacing swaps in the freshly-rendered node with the correct
   * listener. (Inputs are *not* marked, so their focus survives.)
   */
  static markForReplace(el: Element): void {
    (el as unknown as Record<string, boolean>)[REPLACE_ON_RECONCILE] = true;
  }

  /** Re-render a zone's body and patch its DOM in place (focus-preserving). A
   *  failed partial update is reported but scoped — it leaves the zone as-is
   *  rather than replacing the whole page with the error page. */
  static refreshZone(id: string): void {
    const zone = Zones.zones.get(id);
    if (!zone) return;
    if (!zone.element.isConnected) {
      // The zone's element was removed within the page (e.g. an If turned off);
      // prune the stale registration rather than patch a detached node.
      Zones.unregisterZone(id);
      return;
    }
    const scratch = document.createElement("div");
    try {
      zone.render(new DomMarkupWriter(scratch));
    } catch (error) {
      ErrorReporter.report(error, { phase: "zone", zoneId: id, path: location.pathname });
      return;
    }
    Zones.reconcileChildren(zone.element, scratch);
  }

  /** Re-render `render` and patch `element`'s children in place (focus-preserving).
   *  Used by forms to refresh an error display without touching the fields. */
  static patch(element: Element, render: RenderBody): void {
    const scratch = document.createElement(element.tagName || "div");
    try {
      render(new DomMarkupWriter(scratch));
    } catch (error) {
      ErrorReporter.report(error, { phase: "zone", path: location.pathname });
      return;
    }
    Zones.reconcileChildren(element, scratch);
  }

  /** A node's reconciliation key: `data-key`, else `id`; null for unkeyed nodes
   *  (text, or elements with neither). Keys need only be unique among siblings. */
  private static keyOf(node: Node): string | null {
    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const el = node as Element;
    return el.getAttribute("data-key") ?? el.getAttribute("id");
  }

  /**
   * Patch `oldParent`'s children to match `newParent`'s. When any new child is
   * keyed (`data-key`/`id`), old and new are matched **by key** — so an insert,
   * removal, or reorder reuses the right node (focus, listeners, and uncontrolled
   * input values follow the item, not the position). Unkeyed children fall back
   * to positional matching — the original behaviour, correct for stable and
   * append-only lists.
   */
  private static reconcileChildren(oldParent: Node, newParent: Node): void {
    const oldNodes = Array.from(oldParent.childNodes);
    const newNodes = Array.from(newParent.childNodes);
    const keyed = newNodes.some((n) => Zones.keyOf(n) !== null);

    const oldByKey = new Map<string, Node>();
    const oldUnkeyed: Node[] = [];
    for (const n of oldNodes) {
      const k = keyed ? Zones.keyOf(n) : null;
      if (k !== null) oldByKey.set(k, n);
      else oldUnkeyed.push(n);
    }

    // Decide which old node (if any) each new node reuses, and patch it.
    let unkeyedIdx = 0;
    const used = new Set<Node>();
    const results: Node[] = [];
    for (const newNode of newNodes) {
      const key = keyed ? Zones.keyOf(newNode) : null;
      let match: Node | undefined;
      if (key !== null) {
        match = oldByKey.get(key); // keyed: match by key regardless of position
        if (match) oldByKey.delete(key);
      } else {
        match = oldUnkeyed[unkeyedIdx]; // unkeyed: next unkeyed old node
        if (match) unkeyedIdx++;
      }
      const result = match ? Zones.patchNode(match, newNode) : newNode;
      if (result === match) used.add(match); // reused in place
      results.push(result);
    }

    // Order the results (moves reused nodes, inserts new ones).
    let cursor: Node | null = oldParent.firstChild;
    for (const node of results) {
      if (node === cursor) cursor = cursor.nextSibling;
      else oldParent.insertBefore(node, cursor);
    }
    // Remove old nodes not reused (deleted items and wholesale replacements).
    for (const n of oldNodes) {
      if (!used.has(n) && n.parentNode === oldParent) oldParent.removeChild(n);
    }
  }

  /** Patch `oldNode` to match `newNode`, returning the resulting node — the
   *  reused node (reconciled in place) or the fresh replacement. Does NOT
   *  position it; `reconcileChildren` orders the results. */
  private static patchNode(oldNode: Node, newNode: Node): Node {
    // Different type/name, or a listener-bearing element marked for wholesale
    // replacement (attribute-copying can't transfer imperative listeners).
    if (
      oldNode.nodeType !== newNode.nodeType ||
      oldNode.nodeName !== newNode.nodeName ||
      (newNode as unknown as Record<string, boolean>)[REPLACE_ON_RECONCILE]
    ) {
      return newNode;
    }
    if (oldNode.nodeType === Node.TEXT_NODE) {
      if (oldNode.nodeValue !== newNode.nodeValue) oldNode.nodeValue = newNode.nodeValue;
      return oldNode;
    }
    if (oldNode.nodeType === Node.ELEMENT_NODE) {
      const oldEl = oldNode as Element;
      const newEl = newNode as Element;
      for (const attr of Array.from(oldEl.attributes)) {
        if (!newEl.hasAttribute(attr.name)) oldEl.removeAttribute(attr.name);
      }
      for (const attr of Array.from(newEl.attributes)) {
        if (oldEl.getAttribute(attr.name) !== attr.value) oldEl.setAttribute(attr.name, attr.value);
      }
      Zones.reconcileChildren(oldEl, newEl);
      return oldEl;
    }
    return newNode;
  }
}
