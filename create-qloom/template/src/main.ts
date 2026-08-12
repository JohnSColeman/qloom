import { Messages } from "@qloom/core";
import { registerBuiltins } from "@qloom/components";
import { Router } from "@qloom/router";
import messages from "virtual:qloom/messages";
import { Index } from "./pages/Index";
import indexTemplate from "./pages/Index.tml";

// 1. Register the built-in components (Form, Loop, If, Zone, LocaleSelector, …).
registerBuiltins();
// 2. Register the message catalogues consolidated from *.properties at build time.
Messages.registerCatalogues(messages);

const mount = document.querySelector("#app");
if (!mount) throw new Error("missing #app mount point");

// 3. Start the router: URL ↔ page, reconstructable from the URL + @Persist + API.
new Router({
  routes: [{ name: "index", page: Index, template: indexTemplate }],
  mount,
  indexRoute: "index",
}).start();
