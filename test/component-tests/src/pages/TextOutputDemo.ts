import { Page, Property } from "@qloom/runtime";

/**
 * tapestry: TextOutputTest — TextOutput splits paragraph text into lines, each in
 * its own <p>.
 */
export class TextOutputDemo extends Page {
  @Property text = "alpha\nbeta";
}
