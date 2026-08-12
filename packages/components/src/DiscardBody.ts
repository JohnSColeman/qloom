import { Component, MixinAfter } from "@qloom/runtime";

/**
 * Tapestry: `DiscardBody` — a mixin that suppresses the host component's body.
 * `@MixinAfter`, so its `beforeRenderBody` runs after the host's; returning
 * `false` drops the body (the render machine's return-value protocol).
 */
@MixinAfter
export class DiscardBody extends Component {
  beforeRenderBody(): boolean {
    return false;
  }
}
