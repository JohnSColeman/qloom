import { Data } from "@qloom/data";
import { Messages } from "@qloom/core";
import { registerBuiltins } from "@qloom/components";
import { Router } from "@qloom/router";
import { mockFetch } from "./mock";
import { Hotels } from "./pages/Hotels";
import { Hotel } from "./pages/Hotel";
import { HotelGrid } from "./pages/HotelGrid";
import { SearchDemo } from "./pages/SearchDemo";
import { Pel } from "./pages/Pel";
import hotelsTemplate from "./pages/Hotels.tml";
import hotelTemplate from "./pages/Hotel.tml";
import hotelGridTemplate from "./pages/HotelGrid.tml";
import searchDemoTemplate from "./pages/SearchDemo.tml";
import pelTemplate from "./pages/Pel.tml";

// Point the generated client at the mock backend (no server).
Data.configureData({ baseUrl: "/api", fetch: mockFetch() });
Messages.configureMessages({ tagline: "Find your perfect stay" });
registerBuiltins();

const app = document.querySelector("#app");
if (!app) throw new Error("missing #app mount point");

new Router({
  routes: [
    { name: "hotels", page: Hotels, template: hotelsTemplate },
    { name: "hotel", page: Hotel, template: hotelTemplate },
    { name: "grid", page: HotelGrid, template: hotelGridTemplate },
    { name: "search-demo", page: SearchDemo, template: searchDemoTemplate },
    { name: "pel", page: Pel, template: pelTemplate },
  ],
  mount: app,
  indexRoute: "hotels",
}).start();
