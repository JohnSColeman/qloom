import { Page, Property } from "@qloom/runtime";
import { Messages } from "@qloom/core";

// A catalogue entry so a `value="message:demo.label"` default resolves (module
// import runs at app startup).
Messages.configureMessages({ "demo.label": "Hello from catalog" });

/** Drives DefaultValueThing: `greeting` is the property a bare `value` default
 *  reads; `boundLabel` shows a binding overriding a `value` default. */
export class DefaultValueDemo extends Page {
  @Property greeting = "Hi";
  @Property boundLabel = "Bound!";
}
