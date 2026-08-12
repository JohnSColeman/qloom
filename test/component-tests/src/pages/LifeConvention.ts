import { Page } from "@qloom/runtime";
/* eslint-disable @typescript-eslint/no-explicit-any */
const log = (s: string): void => { const w = window as any; (w.__life ??= []).push(s); };
/** Lifecycle by CONVENTION method names (no decorators). */
export class LifeConvention extends Page {
  pageLoaded(): void { log("conv:loaded"); }
  pageAttached(): void { log("conv:attached"); }
  pageReset(): void { log("conv:reset"); }
}
