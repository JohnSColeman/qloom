import { Data } from "@qloom/data";
import { registerBuiltins } from "@qloom/components";
import { Router } from "@qloom/router";
import { mockFetch } from "./mock";
import { Films } from "./pages/Films";
import filmsTemplate from "./pages/Films.tml";

// Point the generated GraphQL client at the mock backend (no server).
Data.configureData({ graphqlEndpoint: "/graphql", fetch: mockFetch() });
registerBuiltins();

const app = document.querySelector("#app");
if (!app) throw new Error("missing #app mount point");

new Router({
  routes: [{ name: "films", page: Films, template: filmsTemplate }],
  mount: app,
  indexRoute: "films",
}).start();
