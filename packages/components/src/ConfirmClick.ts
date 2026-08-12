/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Client gate for the `Confirm` mixin — the Qloom-native analogue of Tapestry's
 * `t5/core/confirm-click`. A single delegated **capture-phase** click listener
 * (installed once) intercepts clicks on any `[data-confirm-message]` element
 * before the host's own bubble-phase handler runs: it asks for confirmation and,
 * only if confirmed, re-dispatches the click (marked `data-confirm-state`) so the
 * host's action proceeds. Cancelling stops the event dead.
 */
export class ConfirmClick {
  private static installed = false;

  static install(): void {
    if (ConfirmClick.installed || typeof document === "undefined") return;
    ConfirmClick.installed = true;
    document.addEventListener(
      "click",
      (e) => {
        const el = (e.target as Element | null)?.closest?.(
          "[data-confirm-message]",
        ) as HTMLElement | null;
        if (!el || el.classList.contains("disabled")) return;
        // A click we already confirmed: clear the flag and let it through.
        if (el.getAttribute("data-confirm-state") === "confirmed") {
          el.removeAttribute("data-confirm-state");
          return;
        }
        // First click: gate it. Capture-phase + stopImmediatePropagation keeps the
        // host's own click handler from firing until the user confirms.
        e.preventDefault();
        e.stopImmediatePropagation();
        const message = el.getAttribute("data-confirm-message") ?? "Are you sure?";
        if ((globalThis as any).confirm?.(message)) {
          el.setAttribute("data-confirm-state", "confirmed");
          el.click(); // re-dispatch — the confirmed click now proceeds to the host
        }
      },
      true,
    );
  }
}
