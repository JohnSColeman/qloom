import { Page, Property } from "@qloom/runtime";
import type { Alert } from "@qloom/components";

/**
 * tapestry: Alerts driven by an app-owned `source` list — one alert per
 * severity, plus a markup alert (rendered as raw HTML). Each renders with an
 * `alert alert-<severity>` class and a dismiss control.
 */
export class AlertsSourceDemo extends Page {
  @Property alerts: Alert[] = [
    { id: "a1", severity: "info", message: "Saved successfully." },
    { id: "a2", severity: "warn", message: "Check your input." },
    { id: "a3", severity: "error", message: "Failed <b>hard</b>", markup: true },
  ];
}
