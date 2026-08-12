import { Component, Import, Parameter, Property, SessionStore } from "@qloom/runtime";
import { authenticator } from "../services/auth";

/**
 * Ported from com.tap5.hotelbooking.components.Layout.
 *
 * The site chrome. `pageTitle`/`title`/`sidebar` are literal-default parameters;
 * the nav menu inside `<t:security.authenticated>` shows when logged in.
 */
@Import({
  stylesheet: ["context:/static/style.css"],
  library: ["context:/static/hotel-booking.js"],
})
export class Layout extends Component {
  @Property pageName = "";

  @Parameter({ required: true }) pageTitle!: string;
  @Parameter() title?: string;
  @Parameter() sidebar?: unknown; // Block — full block support lands later

  // The unchanged Tapestry template reads `user.fullName`; the OpenAPI-generated
  // User carries it as `fullname`. Bridge the two so the greeting resolves.
  get user(): { fullName?: string } | null {
    const u = authenticator.getLoggedUser();
    return u ? { fullName: u.fullname } : null;
  }

  /**
   * The nav's "Log out" actionlink (`t:id="logout"`). Invalidates the session —
   * logs out and clears session-scoped state (SSOs + `@Persist('session')`),
   * mirroring Tapestry's session invalidation — then returns to Signin.
   */
  onActionFromLogout(): unknown {
    authenticator.logout();
    SessionStore.clearSession();
    return "signin";
  }
}
