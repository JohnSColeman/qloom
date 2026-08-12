import { Page, Property } from "@qloom/runtime";

/**
 * Ported from com.tap5.hotelbooking.pages.Settings.
 *
 * The `<form t:id="settingsForm">` is an *implicit* Form (no `t:type`). On
 * submit it checks the two passwords match (Tapestry does this in the
 * validate/success handlers) — a mismatch is shown via `<t:errors/>`.
 */
export class Settings extends Page {
  @Property password = "";
  @Property verifyPassword = "";

  onSubmitFromSettingsForm(): unknown {
    if (this.password !== this.verifyPassword) return "Passwords do not match";
    return "search"; // Tapestry returns Index after the change
  }
}
