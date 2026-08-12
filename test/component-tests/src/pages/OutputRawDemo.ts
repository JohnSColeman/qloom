import { Page, Property } from "@qloom/runtime";

/**
 * tapestry: OutputRawTest — OutputRaw writes unescaped markup to the client.
 */
export class OutputRawDemo extends Page {
  @Property markup = "<b>bold</b>";
}
