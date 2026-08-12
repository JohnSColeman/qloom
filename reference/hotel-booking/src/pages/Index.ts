import { Page } from "@qloom/runtime";
import { Signin } from "./Signin";
import { authenticator } from "../services/auth";

/**
 * Ported from com.tap5.hotelbooking.pages.Index.
 *
 * `onActivate()` redirects — to Search when logged in, else Signin.
 */
export class Index extends Page {
  override onActivate(): unknown {
    return authenticator.isLoggedIn() ? "search" : Signin;
  }
}
