import { Page } from "@qloom/runtime";

/** onPassivate returns an object with an `id`. The router must encode it as its
 *  id ("7") via ctxToString, not "[object Object]" (the double-String bug). */
export class PassivateObjectDemo extends Page {
  private readonly hotel = { id: 7, name: "seven" };

  override onPassivate(): readonly unknown[] {
    return [this.hotel];
  }
}
