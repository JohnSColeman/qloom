import { Page } from "@qloom/runtime";
/** Mixin participation in the render return-value protocol beyond `false`:
 *  a mixin's `true` overrides the host's `false`; a mixin drives the render loop. */
export class ReturnProtocolDemo extends Page {}
