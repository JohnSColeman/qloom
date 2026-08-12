import { Page, Property } from "@qloom/runtime";
import { Captcha } from "@qloom/components";

/** A deterministic challenge provider (Tapestry's tapestry-kaptcha owns this
 *  server-side; Qloom lets the app supply it). Every call yields a *unique*
 *  valid image (a counter-stamped SVG data URI) and id, so a *refresh* (clicking
 *  the image) always changes the rendered src. The "correct" answer is a fixed
 *  constant regardless of challenge. */
const ANSWER = "42";
let seq = 0;
const challengeImage = (n: number): string =>
  `data:image/svg+xml;base64,${btoa(
    `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='16'><text x='0' y='13' font-size='12'>${n}</text></svg>`,
  )}`;

// Wire the provider before any KaptchaImage renders (module import runs at app
// startup; a full page load resets `seq`). Each newChallenge is a fresh challenge.
Captcha.configureCaptcha({
  newChallenge: () => {
    seq += 1;
    return Promise.resolve({ id: `chal-${seq}`, image: challengeImage(seq) });
  },
});

/**
 * tapestry: KaptchaIntegrationTest — the full verify round-trip. Mirrors the
 * hotel-booking Signup: on submit, pair the recorded challenge id with the typed
 * answer; a mismatch surfaces through `<t:errors/>`, a match proceeds (PRG).
 */
export class KaptchaVerifyDemo extends Page {
  @Property fcaptcha = "";

  onSubmitFromForm(): string | void {
    const id = Captcha.getCaptchaChallengeId("kaptcha");
    if (!id || this.fcaptcha !== ANSWER) {
      return "The text you typed does not match the image";
    }
    return "kaptcha-result";
  }
}
