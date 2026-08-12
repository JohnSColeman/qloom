import { Component } from "@qloom/runtime";
import { applyInformals, COMPONENT_ID } from "@qloom/core";
import type { MarkupWriter } from "@qloom/core";
import { Captcha } from "./Captcha.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tapestry: `KaptchaImage` (tapestry-kaptcha). Renders the challenge `<img>`.
 * Since the challenge is fetched async and Qloom renders synchronously, it emits
 * the `<img>` immediately, then fills its `src` (and records the challenge id
 * for `getCaptchaChallengeId`) once the provider resolves — well before the user
 * has read the image and submitted. The plaintext answer never reaches here.
 *
 * The image is a **refresh** control: clicking it regenerates the challenge
 * (fetches a fresh one from the provider and re-records its id), the Qloom
 * analogue of reloading tapestry-kaptcha's server-generated image URL.
 */
export class KaptchaImage extends Component {
  beginRender(writer: MarkupWriter): boolean {
    const imageId = ((this as any)[COMPONENT_ID] as string) ?? "kaptcha";
    writer.element("img");
    applyInformals(writer, this);
    writer.attribute("alt", "captcha challenge");
    writer.attribute("title", "Click for a new challenge");
    const img = writer.currentElement();
    const provider = Captcha.getProvider();
    if (img && provider) {
      const load = (): void => {
        void provider.newChallenge().then((ch) => {
          img.setAttribute("src", ch.image);
          Captcha.recordChallenge(imageId, ch.id);
        });
      };
      load(); // initial challenge
      img.addEventListener("click", (e) => {
        e.preventDefault();
        load(); // refresh: regenerate on click
      });
    }
    return false; // no body
  }
  afterRender(writer: MarkupWriter): void {
    writer.end();
  }
}
