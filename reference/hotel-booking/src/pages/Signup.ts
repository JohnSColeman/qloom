import { Page, Property, Validate } from "@qloom/runtime";
import { Messages } from "@qloom/core";
import { Captcha } from "@qloom/components";
import { bookingApi } from "../../dal/BookingApi";

/**
 * Ported from com.tap5.hotelbooking.pages.Signup.
 *
 * Tapestry's tapestry-kaptcha holds the captcha answer in server session and
 * validates it in-JVM; Qloom is browser-only, so the challenge is generated and
 * verified behind the API (mock in `services/auth.ts`). `KaptchaImage` fetched
 * the challenge and recorded its id; on submit we pair that id with the typed
 * answer (`fcaptcha`) and verify via the generated client — a bad match is shown
 * through `<t:errors/>`, exactly like the password-mismatch check.
 *
 * `@Validate` on the register fields (the `username`/`password` macros are
 * registered app-wide in `main.ts`, mirroring the Tapestry app's
 * `FieldValidatorSource` contributions) replaces the old inline checks; the
 * password-match becomes the form's VALIDATE handler (Tapestry's cross-field
 * validation phase), and `fcaptcha`'s emptiness is now just `required` — its
 * message resolves from the `fcaptcha-required-message` key in the ported
 * `Signup.properties` bundle. Only the async captcha-answer verification (which
 * needs a network round-trip) stays in the submit handler, combining
 * Tapestry's SUCCESS (create + proceed) into Qloom's single async `submit`.
 */
export class Signup extends Page {
  @Property @Validate("username") username = "";
  @Property @Validate("required,minlength=3,maxlength=50") fullname = "";
  @Property @Validate("required,email") email = "";
  @Property @Validate("password") password = "";
  @Property @Validate("password") verifyPassword = "";
  @Property @Validate("required") fcaptcha = ""; // the captcha answer the user types (KaptchaField t:id)
  @Property kaptcha = ""; // the KaptchaImage's `image` handle (unused property)

  onValidateFromRegisterForm(): string | void {
    // The message is the ported `error.verifypassword` catalogue key (app.properties).
    if (this.password !== this.verifyPassword) return Messages.message("error.verifypassword");
  }

  async onSubmitFromRegisterForm(): Promise<unknown> {
    const challengeId = Captcha.getCaptchaChallengeId("kaptcha"); // the <t:kaptchaimage t:id="kaptcha">
    const { valid } = await bookingApi.verifyCaptcha({
      id: challengeId ?? "",
      answer: this.fcaptcha,
    });
    if (!valid) {
      return "The text you typed does not match the image";
    }

    // Tapestry creates the user + logs in here; the mock backend has no user
    // creation endpoint, so we proceed straight to Signin (PRG).
    return "signin";
  }
}
