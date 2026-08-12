import { Page } from "@qloom/runtime";
import type { MarkupWriter } from "@qloom/core";

/**
 * tapestry: Trigger fires an event during rendering. Here `decorate` lets the
 * page inject content into the render stream via the passed MarkupWriter.
 */
export class TriggerDemo extends Page {
  onDecorate(writer: MarkupWriter): void {
    writer.element("span");
    writer.attribute("id", "decorated");
    writer.text("decorated by trigger");
    writer.end();
  }

  // A Trigger with no `event` parameter fires the default "action" event.
  onAction(writer: MarkupWriter): void {
    writer.element("span");
    writer.attribute("id", "default-fired");
    writer.text("action fired");
    writer.end();
  }
}
