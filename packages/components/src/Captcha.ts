import type { CaptchaProvider } from "./types.js";

/** Captcha wiring (Tapestry: the tapestry-kaptcha module). The provider and the
 *  per-image challenge ids are shared mutable state, so a static class (module
 *  architecture rule 2). */
export class Captcha {
  private static provider: CaptchaProvider | null = null;
  private static readonly challengeByImage = new Map<string, string>();

  /** Wire up where captcha challenges come from (call once at app startup). */
  static configureCaptcha(provider: CaptchaProvider): void {
    Captcha.provider = provider;
  }

  /** The current challenge id for a `KaptchaImage` (by its `t:id`) — the submit
   *  handler pairs it with the typed answer to verify against the API. */
  static getCaptchaChallengeId(imageId: string): string | undefined {
    return Captcha.challengeByImage.get(imageId);
  }

  /** The configured provider (used by `KaptchaImage` to fetch a challenge). */
  static getProvider(): CaptchaProvider | null {
    return Captcha.provider;
  }

  /** Record the challenge id a `KaptchaImage` fetched, keyed by its `t:id`. */
  static recordChallenge(imageId: string, id: string): void {
    Captcha.challengeByImage.set(imageId, id);
  }
}
