import { Page, PageAttached, PageReset } from "@qloom/runtime";
/* eslint-disable @typescript-eslint/no-explicit-any */
const log = (s: string): void => { const w = window as any; (w.__life ??= []).push(s); };
/** Redirects in onActivate — pageAttached should fire, pageReset should NOT. */
export class LifeRedirect extends Page {
  @PageAttached onAttached(): void { log("R:attached"); }
  @PageReset onReset(): void { log("R:reset"); }
  onActivate(): string { return "life-b"; }
}
