import { Page, PageLoaded, PageAttached, PageDetached, PageReset } from "@qloom/runtime";
/* eslint-disable @typescript-eslint/no-explicit-any */
const log = (s: string): void => { const w = window as any; (w.__life ??= []).push(s); };

/** Records each page-lifecycle callback (via the decorators) + onActivate, so a
 *  spec can assert firing + ordering across navigation. */
export class LifePageA extends Page {
  @PageLoaded onLoaded(): void { log("A:loaded"); }
  @PageAttached onAttached(): void { log("A:attached"); }
  @PageReset onReset(): void { log("A:reset"); }
  @PageDetached onDetached(): void { log("A:detached"); }
  onActivate(): void { log("A:activate"); }
}
