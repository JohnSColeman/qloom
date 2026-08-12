import { Page } from "@qloom/runtime";
/** app1 Index: the renderdisabled mixin renders `disabled` from the field's
 *  `disabled` binding. No `t:mixins` here — every field carries it automatically
 *  (`@Mixin("renderdisabled")` on the `Field` base, matching Tapestry's
 *  `AbstractField`). */
export class RenderDisabledDemo extends Page {}
