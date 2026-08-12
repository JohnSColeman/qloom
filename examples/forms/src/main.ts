import { registerBuiltins } from "@qloom/components";
import { Router } from "@qloom/router";
import { Signup } from "./pages/Signup";
import { Thanks } from "./pages/Thanks";
import { Wizard } from "./pages/Wizard";
import signupTemplate from "./pages/Signup.tml";
import thanksTemplate from "./pages/Thanks.tml";
import wizardTemplate from "./pages/Wizard.tml";

registerBuiltins();

const app = document.querySelector("#app");
if (!app) throw new Error("missing #app mount point");

new Router({
  routes: [
    { name: "signup", page: Signup, template: signupTemplate },
    { name: "thanks", page: Thanks, template: thanksTemplate },
    { name: "wizard", page: Wizard, template: wizardTemplate },
  ],
  mount: app,
  indexRoute: "signup",
}).start();
