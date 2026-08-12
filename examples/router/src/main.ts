import { registerBuiltins } from "@qloom/components";
import { SessionStore } from "@qloom/runtime";
import { Router } from "@qloom/router";
import { Home } from "./pages/Home";
import { Counter } from "./pages/Counter";
import homeTemplate from "./pages/Home.tml";
import counterTemplate from "./pages/Counter.tml";

registerBuiltins();

const app = document.querySelector("#app");
if (!app) throw new Error("missing #app mount point");

// Hydrate persisted state (e.g. Home's @Persist visits) before first render.
void SessionStore.initPersistence().then(() => {
  new Router({
    routes: [
      { name: "home", page: Home, template: homeTemplate },
      { name: "counter", page: Counter, template: counterTemplate },
    ],
    mount: app,
    indexRoute: "home",
  }).start();
});
