import { Page } from "@qloom/runtime";
import { AlertStorage } from "@qloom/components";

/**
 * tapestry: Alerts driven by the shared AlertStorage. The EventLinks add alerts
 * dynamically (the container re-renders via its subscription); dismissing an
 * alert removes it from the store and re-renders.
 */
export class AlertsDynamicDemo extends Page {
  private n = 0;

  onAddInfo(): void {
    AlertStorage.info(`Info ${++this.n}`);
  }
  onAddError(): void {
    AlertStorage.error(`Error ${++this.n}`);
  }
  onClearAlerts(): void {
    AlertStorage.clear();
  }
}
