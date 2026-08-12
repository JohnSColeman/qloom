import { Registry, Messages, Assets } from "@qloom/core";
import { registerBuiltins, Captcha } from "@qloom/components";
import { SessionStore } from "@qloom/runtime";
import { Validators } from "@qloom/validation";
import { bookingApi } from "../dal/BookingApi";
import { Router } from "@qloom/router";
import { Layout } from "./components/Layout";
import { Authenticated } from "./components/security/Authenticated";
import { HotelClass } from "./components/HotelClass";
import { Workspace } from "./components/Workspace";
import { YourBookings } from "./components/YourBookings";
import layoutTemplate from "./components/Layout.tml";
import hotelClassTemplate from "./components/HotelClass.tml";
import workspaceTemplate from "./components/Workspace.tml";
import yourBookingsTemplate from "./components/YourBookings.tml";
import { Index } from "./pages/Index";
import indexTemplate from "./pages/Index.tml";
import { Signin } from "./pages/Signin";
import signinTemplate from "./pages/Signin.tml";
import { View } from "./pages/View";
import viewTemplate from "./pages/View.tml";
import { Search } from "./pages/Search";
import searchTemplate from "./pages/Search.tml";
import { Settings } from "./pages/Settings";
import settingsTemplate from "./pages/Settings.tml";
import { Book } from "./pages/Book";
import bookTemplate from "./pages/Book.tml";
import { Signup } from "./pages/Signup";
import signupTemplate from "./pages/Signup.tml";

// Built-ins (if/loop/eventlink/pagelink/form/...) and this app's components.
registerBuiltins();
// Resolve `context:`/`asset:` paths (stylesheets, images) under the app's mount
// base — "/" in dev, "/<repo>/" on a GitHub Pages project site — so static
// assets load correctly there. Trailing slash trimmed; "" for the domain root.
const base = import.meta.env.BASE_URL;
Assets.configure({ contextRoot: base === "/" ? "" : base.replace(/\/$/, "") });
// App-wide validator macros, ported from the Tapestry app's FieldValidatorSource
// contributions (AppModule) — used by Signin/Settings' `t:validate="username"`
// / `"password"` markup and Signup's `@Validate("username")` / `("password")`.
Validators.registerMacro("username", "required,minlength=3,maxlength=15");
Validators.registerMacro("password", "required,minlength=6,maxlength=12");
Registry.registerComponent("layout", Layout, layoutTemplate);
Registry.registerComponent("security.authenticated", Authenticated);
// This app's hotel-booking-specific components (moved out of @qloom/components).
Registry.registerComponent("hotelclass", HotelClass, hotelClassTemplate);
Registry.registerComponent("workspace", Workspace, workspaceTemplate);
Registry.registerComponent("yourbookings", YourBookings, yourBookingsTemplate);
// Static text comes from the Tapestry `.properties` bundles, consumed
// byte-for-byte and consolidated at build time by the Qloom Vite plugin:
// app-global `src/app.properties` (Search's no-result), co-located
// `src/pages/Book.properties` (smoking radio labels, resolved by `<t:label>` as
// `<fieldId>-label`), `src/pages/Signup.properties` (captcha required-message).
import messageCatalogues from "virtual:qloom/messages";
Messages.registerCatalogues(messageCatalogues);
// Captcha challenges come from the API (mock backend) — the tapestry-kaptcha analogue.
Captcha.configureCaptcha({ newChallenge: () => bookingApi.newCaptcha({}) });

const app = document.querySelector("#app");
if (!app) throw new Error("missing #app mount point");

// Restore any encrypted session state (e.g. Search criteria) before first paint,
// then start routing. Index.onActivate() redirects to Signin when logged out.
void SessionStore.initPersistence().then(() => {
  new Router({
    routes: [
      { name: "index", page: Index, template: indexTemplate },
      { name: "signin", page: Signin, template: signinTemplate },
      { name: "view", page: View, template: viewTemplate },
      { name: "search", page: Search, template: searchTemplate },
      { name: "settings", page: Settings, template: settingsTemplate },
      { name: "book", page: Book, template: bookTemplate },
      { name: "signup", page: Signup, template: signupTemplate },
    ],
    mount: app,
    indexRoute: "index",
    // Served under "/" in dev, but under "/<repo>/" on a GitHub Pages project
    // site — Vite injects the build-time base here so clean URLs keep working.
    basename: import.meta.env.BASE_URL,
  }).start();
});
