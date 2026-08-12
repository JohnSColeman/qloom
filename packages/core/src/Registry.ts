import type { ComponentDefinition, RenderProgram } from "./types.js";

/** The component registry: type name → definition. Shared mutable state, so a
 *  static class (module architecture rule 2). */
export class Registry {
  private static readonly components = new Map<string, ComponentDefinition>();

  static registerComponent(type: string, ctor: new () => object, template?: RenderProgram): void {
    Registry.components.set(type.toLowerCase(), template ? { ctor, template } : { ctor });
  }

  static getComponentDefinition(type: string): ComponentDefinition {
    const def = Registry.components.get(type.toLowerCase());
    if (!def) throw new Error(`qloom: no component registered for type "${type}"`);
    return def;
  }

  static clearRegistry(): void {
    Registry.components.clear();
  }
}
