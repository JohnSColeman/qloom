import { Component } from "@qloom/runtime";
import { authenticator } from "../../services/auth";

/**
 * Ported from com.tap5.hotelbooking.components.security.Authenticated
 * (extends Tapestry's AbstractConditional; `test()` = `authenticator.isLoggedIn()`).
 *
 * Renders its body (the nav menu) only when logged in.
 */
export class Authenticated extends Component {
  setupRender(): boolean {
    return authenticator.isLoggedIn();
  }
}
