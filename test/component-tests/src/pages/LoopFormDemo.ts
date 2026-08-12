import { Page, Property } from "@qloom/runtime";

/**
 * A `<t:loop>` of fields inside a `<t:form>`: each row's TextField binds to the
 * loop value's property, so editing several rows and submitting must round-trip
 * *every* row's edit back to the collection (Tapestry's volatile loop-in-form
 * over the live in-memory source). The form's zone re-renders the joined result
 * so the test can read what landed in the collection.
 */
export class LoopFormDemo extends Page {
  @Property rows: { name: string }[] = [{ name: "alpha" }, { name: "beta" }, { name: "gamma" }];
  @Property row!: { name: string };

  get joined(): string {
    return this.rows.map((r) => r.name).join(",");
  }
}
