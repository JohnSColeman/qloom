/**
 * @qloom/core — the engine spine.
 *
 * M2: MarkupWriter, component registry, parameter bindings, render-phase state
 *     machine (Tapestry return-value protocol).
 * M3: component-tree event bubbling, and Zones (re-render a subtree through a
 *     focus-preserving reconciler).
 */
export type {
  MarkupWriter,
  RenderProgram,
  RenderBody,
  Binding,
  ComponentDefinition,
  RouterHooks,
  MountOptions,
  QloomErrorContext,
  ErrorReporterOptions,
} from "./types.js";
export {
  BINDINGS,
  STORAGE,
  PARAMS,
  PHASES,
  LIFECYCLE,
  CONTAINER,
  COMPONENT_ID,
  CHILDREN,
  ACTIVATION_CONTEXT,
  CHILD_BODY,
  ON_EVENT,
  INFORMALS,
  IMPORTS,
  VALIDATE_SPEC,
  MIXIN_AFTER,
  CLASS_MIXINS,
} from "./symbols.js";
export { DomMarkupWriter } from "./DomMarkupWriter.js";
export { Assets } from "./Assets.js";
export { Registry } from "./Registry.js";
export { Messages } from "./Messages.js";
export { Navigation } from "./Navigation.js";
export { ErrorReporter } from "./ErrorReporter.js";
export { Zones } from "./Zones.js";
export { Environment } from "./Environment.js";
export { triggerEvent } from "./triggerEvent.js";
export { driveInstance } from "./driveInstance.js";
export { renderComponent } from "./renderComponent.js";
export { resolveMixins } from "./resolveMixins.js";
export { invokeLifecycle } from "./invokeLifecycle.js";
export { resolveDefaultPrefix } from "./resolveDefaultPrefix.js";
export { applyInformals } from "./applyInformals.js";
export { mount } from "./mount.js";
export { pelRange } from "./pelRange.js";
export { CORE_VERSION } from "./version.js";
