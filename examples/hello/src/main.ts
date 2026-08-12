import { mount, Registry } from "@qloom/core";
import { registerBuiltins } from "@qloom/components";
import { Hello } from "./Hello";
import { Panel } from "./Panel";
import helloTemplate from "./Hello.tml";
import panelTemplate from "./Panel.tml";

// Register the built-in components (if/unless/loop) and the app's own Panel.
registerBuiltins();
Registry.registerComponent("panel", Panel, panelTemplate);

const app = document.querySelector("#app");
if (!app) throw new Error("missing #app mount point");

mount(new Hello(), helloTemplate, { mount: app });
