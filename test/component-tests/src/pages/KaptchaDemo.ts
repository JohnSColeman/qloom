import { Page, Property } from "@qloom/runtime";

/**
 * tapestry: KaptchaIntegrationTest — KaptchaImage renders a challenge <img> and
 * KaptchaField renders the paired text input. Qloom verifies the challenge
 * behind the API (browser-only), so the full verify flow needs a captchaProvider.
 */
export class KaptchaDemo extends Page {
  @Property fcaptcha = "";
}
