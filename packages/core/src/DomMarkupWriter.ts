import type { MarkupWriter } from "./types.js";

export class DomMarkupWriter implements MarkupWriter {
  private readonly stack: Element[];

  constructor(root: Element) {
    this.stack = [root];
  }

  private cursor(): Element {
    return this.stack[this.stack.length - 1]!;
  }

  element(tag: string): void {
    const el = document.createElement(tag);
    this.cursor().appendChild(el);
    this.stack.push(el);
  }

  attribute(name: string, value: string): void {
    this.cursor().setAttribute(name, value);
  }

  text(value: string): void {
    this.cursor().appendChild(document.createTextNode(value));
  }

  raw(html: string): void {
    const tmpl = document.createElement("template");
    tmpl.innerHTML = html;
    this.cursor().appendChild(tmpl.content.cloneNode(true));
  }

  end(): void {
    if (this.stack.length > 1) this.stack.pop();
  }

  currentElement(): Element | null {
    return this.cursor();
  }
}
