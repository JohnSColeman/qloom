import { Component, Parameter } from "@qloom/runtime";
import type { MarkupWriter } from "@qloom/core";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tapestry: `Tree` — renders a recursive tree of expandable/collapsible nodes
 * from a model (`{ label, children? }`). Child lists start collapsed; clicking a
 * node's label toggles them.
 */
export class Tree extends Component {
  @Parameter() model: any;

  beginRender(writer: MarkupWriter): boolean {
    const roots = Array.isArray(this.model) ? this.model : this.model ? [this.model] : [];
    Tree.renderNodes(writer, roots);
    return false; // no template body
  }

  private static renderNodes(writer: MarkupWriter, nodes: readonly any[]): void {
    writer.element("ul");
    for (const node of nodes) {
      writer.element("li");
      writer.element("span");
      writer.attribute("class", "tree-label");
      writer.text(String(node?.label ?? ""));
      const labelEl = writer.currentElement();
      writer.end(); // </span>
      const children: any[] = node?.children ?? [];
      if (children.length) {
        writer.element("div");
        writer.attribute("style", "display:none");
        const childContainer = writer.currentElement() as HTMLElement | null;
        Tree.renderNodes(writer, children);
        writer.end(); // </div>
        if (labelEl && childContainer) {
          labelEl.addEventListener("click", () => {
            childContainer.style.display = childContainer.style.display === "none" ? "" : "none";
          });
        }
      }
      writer.end(); // </li>
    }
    writer.end(); // </ul>
  }
}
