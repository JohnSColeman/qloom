import { Page, Property } from "@qloom/runtime";
import { authenticator } from "../services/auth";

/**
 * Ported from com.tap5.hotelbooking.pages.Signin.
 *
 * `username`/`password` two-way bind to the fields (via their `t:id`). On submit
 * the Form validates, then fires `submit` → `onSubmitFromLoginForm`, which calls
 * the generated `authenticate` operation. Bad credentials → the message is shown
 * by `<t:errors/>`; success returns Index (Tapestry's redirect — the onward nav
 * to Search awaits the Grid component).
 */
export class Signin extends Page {
  @Property flashmessage = "";
  @Property username = "";
  @Property password = "";

  async onSubmitFromLoginForm(): Promise<unknown> {
    try {
      await authenticator.login(this.username, this.password);
      return "index";
    } catch (err) {
      return err instanceof Error ? err.message : "Login failed";
    }
  }
}
