import { Component } from "@qloom/runtime";

/** A "before" mixin (NOT @MixinAfter) that returns true from beforeRenderBody —
 *  aborting the host's own beforeRenderBody, so the body renders. Proves a mixin's
 *  boolean participates beyond just `false`. */
export class ForceBody extends Component {
  beforeRenderBody(): boolean {
    return true;
  }
}
