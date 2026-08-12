/** A `.tml` compile failure. Carries the 1-based source position (when known)
 *  both in the message (`name:line:col: …`) and as fields, so a build tool can
 *  map it to an editor overlay. */
export class TemplateCompileError extends Error {
  override name = "TemplateCompileError";
  constructor(
    message: string,
    readonly line?: number,
    readonly column?: number,
  ) {
    super(message);
  }
}
