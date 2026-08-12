import { Component, BeforeRenderBody, CleanupRender } from "@qloom/runtime";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Throws while rendering its body, and records on `window` whether
 *  cleanupRender still ran. Proves driveInstance runs cleanupRender via
 *  try/finally even on a throw — so a component that restores shared render
 *  state in cleanup (Form ↔ CurrentForm) is never stranded. */
export class CleanupProbe extends Component {
  @BeforeRenderBody boom(): void {
    throw new Error("boom in body");
  }

  @CleanupRender done(): void {
    (window as any).__cleanupRan = true;
  }
}
