import type { Alert, Severity } from "./types.js";

/**
 * Tapestry: the `AlertStorage` / `AlertManager` model behind the `Alerts`
 * component. Holds the live alerts and notifies the rendered `Alerts` container
 * to refresh when one is added or dismissed. Shared mutable state, so a static
 * class (module architecture rule 2).
 */
export class AlertStorage {
  private static items: Alert[] = [];
  private static seq = 0;
  private static listener: (() => void) | null = null;

  /** Add an alert; returns its id. Notifies the live `Alerts` container. */
  static add(severity: Severity, message: string, opts?: { markup?: boolean }): string {
    const id = `alert-${AlertStorage.seq++}`;
    AlertStorage.items = [
      ...AlertStorage.items,
      { id, severity, message, markup: opts?.markup ?? false },
    ];
    AlertStorage.listener?.();
    return id;
  }

  /** Convenience helpers per severity. */
  static info(message: string, opts?: { markup?: boolean }): string {
    return AlertStorage.add("info", message, opts);
  }
  static warn(message: string, opts?: { markup?: boolean }): string {
    return AlertStorage.add("warn", message, opts);
  }
  static error(message: string, opts?: { markup?: boolean }): string {
    return AlertStorage.add("error", message, opts);
  }

  static getAlerts(): readonly Alert[] {
    return AlertStorage.items;
  }

  /** Dismiss one alert by id; notifies the live container. */
  static dismiss(id: string): void {
    AlertStorage.items = AlertStorage.items.filter((a) => a.id !== id);
    AlertStorage.listener?.();
  }

  /** Remove every alert. */
  static clear(): void {
    AlertStorage.items = [];
    AlertStorage.listener?.();
  }

  /** The live `Alerts` container registers its refresh callback here (one at a
   *  time — the most-recently rendered Alerts owns the display). */
  static subscribe(fn: () => void): void {
    AlertStorage.listener = fn;
  }
  static unsubscribe(fn: () => void): void {
    if (AlertStorage.listener === fn) AlertStorage.listener = null;
  }
}
