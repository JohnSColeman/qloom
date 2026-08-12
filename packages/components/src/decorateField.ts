/* eslint-disable @typescript-eslint/no-explicit-any */

/** Injects Tapestry-5.3-style error decoration next to an input, in the live DOM
 *  (not the initial markup — so it composes with any Field subclass). Adds/removes
 *  `t-error` on the input, shows a `t-error-icon`, and a `t-error-popup` bubble —
 *  positioned **above** the field and carrying a ✕ close control — that is visible
 *  only while the (invalid) input is focused. */
export function decorateField(
  input: HTMLInputElement | HTMLTextAreaElement,
): { mark(message: string | null): void } {
  let icon: HTMLElement | null = null;
  let popup: HTMLElement | null = null;
  let text: HTMLElement | null = null;

  const ensure = () => {
    if (!icon) {
      icon = document.createElement("span");
      icon.className = "t-error-icon";
      icon.textContent = "✕";
      input.insertAdjacentElement("afterend", icon);
    }
    if (!popup) {
      popup = document.createElement("div");
      popup.className = "t-error-popup";
      text = document.createElement("span");
      popup.appendChild(text);
      // The bubble's own ✕ dismisses it without blurring the field.
      const close = document.createElement("span");
      close.className = "t-error-popup-close";
      close.textContent = "✕";
      close.addEventListener("mousedown", (e) => {
        e.preventDefault(); // keep the input focused
        if (popup) popup.style.display = "none";
      });
      popup.appendChild(close);
      icon.insertAdjacentElement("afterend", popup);
    }
  };

  /** Place the bubble just above the input (flipping below only when there is no
   *  room above), using viewport coordinates so it works regardless of the
   *  field's layout context. Runs after the popup is shown (so it has a height). */
  const position = () => {
    if (!popup) return;
    const r = input.getBoundingClientRect();
    popup.style.position = "fixed";
    popup.style.left = `${Math.round(r.left)}px`;
    const above = r.top - popup.offsetHeight - 8;
    popup.style.top = `${Math.round(above >= 4 ? above : r.bottom + 8)}px`;
  };

  const syncPopup = () => {
    if (!popup) return;
    if (document.activeElement === input && input.classList.contains("t-error")) {
      popup.style.display = "";
      position();
    } else {
      popup.style.display = "none";
    }
  };
  input.addEventListener("focus", syncPopup);

  return {
    mark(message: string | null): void {
      if (message) {
        ensure();
        input.classList.add("t-error");
        icon!.style.display = "";
        text!.textContent = message;
        syncPopup();
      } else {
        input.classList.remove("t-error");
        if (icon) icon.style.display = "none";
        if (popup) popup.style.display = "none";
      }
    },
  };
}
