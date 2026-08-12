import { Page, Property, InjectComponent } from "@qloom/runtime";
import type { Marker } from "../components/Marker";

/** @InjectComponent resolves the embedded `widget` (a Marker) by t:id; the
 *  submit handler calls a method on the injected instance. */
export class InjectComponentDemo extends Page {
  @Property result = "";

  @InjectComponent()
  widget!: Marker;

  onSubmitFromProbe(): void {
    this.result = this.widget ? this.widget.greet() : "null";
  }
}
