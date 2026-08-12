import { Component } from "@qloom/runtime";
import { applyInformals, BINDINGS, Zones } from "@qloom/core";
import type { MarkupWriter } from "@qloom/core";
import { AlertStorage } from "./AlertStorage.js";
import type { Alert } from "./types.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tapestry: `Alerts` — renders the alert messages held by the alert model. Each
 * alert is a `<div class="alert alert-<severity>">` (severity: info/warn/error)
 * carrying its message and a dismiss (×) control. The alert list comes from a
 * bound `source` (an app-owned array) if provided, else the shared
 * `AlertStorage`; when reading `AlertStorage`, the container re-renders in place
 * as alerts are added or dismissed.
 */
export class Alerts extends Component {
  private containerEl: Element | null = null;
  private sourceBound = false;
  private readonly refresh = (): void => {
    if (this.containerEl) Zones.patch(this.containerEl, (w) => this.renderAlerts(w));
  };

  beginRender(writer: MarkupWriter): boolean {
    writer.element("div");
    applyInformals(writer, this);
    writer.attribute("class", "alert-container");
    this.containerEl = writer.currentElement();
    this.sourceBound = Array.isArray((this as any)[BINDINGS]?.source?.get?.());
    this.renderAlerts(writer);
    // Only subscribe to the shared store when not driven by an app-owned source.
    if (!this.sourceBound) AlertStorage.subscribe(this.refresh);
    return false; // no template body
  }
  afterRender(writer: MarkupWriter): void {
    writer.end();
  }

  private currentAlerts(): Alert[] {
    const src = (this as any)[BINDINGS]?.source?.get?.();
    return Array.isArray(src) ? (src as Alert[]) : Array.from(AlertStorage.getAlerts());
  }

  private renderAlerts(writer: MarkupWriter): void {
    for (const alert of this.currentAlerts()) {
      writer.element("div");
      writer.attribute("class", `alert alert-${alert.severity}`);
      if (alert.id) writer.attribute("data-alert-id", alert.id);
      const alertEl = writer.currentElement();

      writer.element("span");
      writer.attribute("class", "alert-message");
      if (alert.markup) writer.raw(alert.message);
      else writer.text(alert.message);
      writer.end();

      writer.element("button");
      writer.attribute("type", "button"); // never submit an enclosing form
      writer.attribute("class", "alert-dismiss");
      writer.attribute("title", "Dismiss");
      writer.text("×"); // ×
      const dismissBtn = writer.currentElement();
      writer.end();
      writer.end(); // alert div

      dismissBtn?.addEventListener("click", () => this.dismiss(alert, alertEl));
    }
  }

  private dismiss(alert: Alert, el: Element | null): void {
    if (this.sourceBound) {
      el?.remove(); // app owns the source array; visually remove this alert
    } else if (alert.id) {
      AlertStorage.dismiss(alert.id); // removes from the store and re-renders
    }
  }
}
