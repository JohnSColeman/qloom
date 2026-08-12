import { Component } from "@qloom/runtime";

/** A mixin that drives the host's render loop: returns false from afterRender the
 *  first time (re-render), then true (stop). Proves a mixin participates in the
 *  return-value loop protocol, just like Loop's own afterRender. */
export class RepeatOnce extends Component {
  private done = false;
  afterRender(): boolean {
    if (this.done) return true;
    this.done = true;
    return false; // re-render once more
  }
}
