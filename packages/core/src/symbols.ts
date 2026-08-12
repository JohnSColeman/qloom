/**
 * Per-instance / prototype metadata keys shared with @qloom/runtime (the
 * decorators write these; the engine reads them).
 */

export const BINDINGS: unique symbol = Symbol("qloom.bindings");
export const STORAGE: unique symbol = Symbol("qloom.storage");
export const PARAMS: unique symbol = Symbol("qloom.params");
export const PHASES: unique symbol = Symbol("qloom.phases");

/** Prototype map of page-lifecycle callback name → method name (Tapestry's
 *  `@PageLoaded`/`@PageAttached`/`@PageDetached`/`@PageReset`). Router-driven, so
 *  kept separate from `PHASES` (which the render engine owns). */
export const LIFECYCLE: unique symbol = Symbol("qloom.lifecycle");
/** Per-instance: the container component/page (for event bubbling). */
export const CONTAINER: unique symbol = Symbol("qloom.container");
/** Per-instance: the component's `t:id`. */
export const COMPONENT_ID: unique symbol = Symbol("qloom.componentId");
/** Per-instance: map of `t:id` → embedded child instance (for @InjectComponent). */
export const CHILDREN: unique symbol = Symbol("qloom.children");
/** Prototype: ordered field names bound to URL activation-context slots
 *  (for @PageActivationContext). */
export const ACTIVATION_CONTEXT: unique symbol = Symbol("qloom.activationContext");
/** Per-instance: the component's body renderer (Zone uses it to re-render). */
export const CHILD_BODY: unique symbol = Symbol("qloom.childBody");
/** Prototype: @OnEvent registrations. */
export const ON_EVENT: unique symbol = Symbol("qloom.onEvent");
/** Per-instance: host-form informal parameters (attributes to render on the root). */
export const INFORMALS: unique symbol = Symbol("qloom.informals");
/** Prototype: @Import asset metadata (stylesheet/library). */
export const IMPORTS: unique symbol = Symbol("qloom.imports");
/** Prototype: @Validate spec strings keyed by property name. */
export const VALIDATE_SPEC: unique symbol = Symbol("qloom.validateSpec");
/** Prototype: marks a mixin whose render phases run *after* the host component's
 *  (Tapestry's @MixinAfter). Absent ⇒ the mixin runs before the host. */
export const MIXIN_AFTER: unique symbol = Symbol("qloom.mixinAfter");

/** Prototype-level list of implementation mixins (Tapestry `@Mixin`): mixins a
 *  component class always carries, independent of any `t:mixins` in the template.
 *  Each entry is `{ name, order }`. */
export const CLASS_MIXINS: unique symbol = Symbol("qloom.classMixins");
