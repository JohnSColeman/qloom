import type { AjaxRowController } from "./types.js";

/**
 * Render-time context for AjaxFormLoop rows: the most recently rendered loop
 * (so a sibling AddRowLink can target it) and the current row's loop + index
 * (so a RemoveRowLink inside the body knows which row it belongs to). Shared
 * mutable render-state, so a static class (module architecture rule 2).
 */
export class AjaxLoopState {
  private static loop: AjaxRowController | null = null;
  private static row: { loop: AjaxRowController; index: number } | null = null;

  static getLoop(): AjaxRowController | null {
    return AjaxLoopState.loop;
  }
  static setLoop(loop: AjaxRowController | null): void {
    AjaxLoopState.loop = loop;
  }
  static getRow(): { loop: AjaxRowController; index: number } | null {
    return AjaxLoopState.row;
  }
  static setRow(row: { loop: AjaxRowController; index: number } | null): void {
    AjaxLoopState.row = row;
  }
}
