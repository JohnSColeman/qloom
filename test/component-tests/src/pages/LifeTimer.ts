import { Page, PageAttached, PageDetached } from "@qloom/runtime";
/* eslint-disable @typescript-eslint/no-explicit-any */
/** Starts a timer in pageAttached, clears it in pageDetached — proves teardown. */
export class LifeTimer extends Page {
  private timer: ReturnType<typeof setInterval> | undefined;
  @PageAttached onAttached(): void {
    (window as any).__timerTicks = 0;
    this.timer = setInterval(() => { (window as any).__timerTicks++; }, 50);
  }
  @PageDetached onDetached(): void {
    if (this.timer) clearInterval(this.timer);
  }
}
