import { Page, Property } from "@qloom/runtime";

/** Ported from app1 BindParameterDemo: a field whose `value` is two-way-bound to
 *  a page property, wrapped by the `echovalue` mixin. The mixin reaches the same
 *  property through `@BindParameter` — reading it (the `_before`/`_after` divs),
 *  overwriting it during the host's render (the input's rendered value), and
 *  restoring it (the `${myproperty}` output). */
export class BindParameterDemo extends Page {
  @Property myproperty = "initial";
}
