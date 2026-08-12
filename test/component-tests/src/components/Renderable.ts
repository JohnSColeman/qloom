import type { MarkupWriter } from "@qloom/core";

/** Tapestry app1 `Renderable`: a value pushed into the Environment that knows how
 *  to render itself. Used as both the environment token (its constructor) and the
 *  pushed instance in the @Environmental demo. */
export class Renderable {
  constructor(private readonly message: string) {}

  render(writer: MarkupWriter): void {
    writer.element("strong");
    writer.text(this.message);
    writer.end();
  }

  /** The message text, so a consumer can prove it injected the actual instance. */
  toText(): string {
    return this.message;
  }
}
