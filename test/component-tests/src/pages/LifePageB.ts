import { Page, PageAttached } from "@qloom/runtime";
/* eslint-disable @typescript-eslint/no-explicit-any */
const log = (s: string): void => { const w = window as any; (w.__life ??= []).push(s); };
export class LifePageB extends Page {
  @PageAttached onAttached(): void { log("B:attached"); }
}
