import {
  BINDINGS,
  CONTAINER,
  COMPONENT_ID,
  CHILDREN,
  CHILD_BODY,
  INFORMALS,
  PARAMS,
} from "./symbols.js";
import { Registry } from "./Registry.js";
import { driveInstance } from "./driveInstance.js";
import { resolveMixins } from "./resolveMixins.js";
import type { Binding, MarkupWriter, RenderBody } from "./types.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Tapestry throws at structure-assembly when a `required` parameter is left
 *  unbound; Qloom's analogue is here, as the component is instantiated. Without
 *  this a missing required binding silently reads `undefined` and fails far away. */
function assertRequiredParams(
  instance: any,
  type: string,
  id: string | undefined,
  bindings: Record<string, Binding>,
): void {
  const params = instance[PARAMS] as Record<string, { required?: boolean }> | undefined;
  if (!params) return;
  for (const [name, opts] of Object.entries(params)) {
    if (opts.required && bindings[name] === undefined) {
      const where = id ? `<${type} t:id="${id}">` : `<${type}>`;
      throw new Error(`qloom: required parameter "${name}" of ${where} is not bound.`);
    }
  }
}

/** Render a child component by type. Called by compiled templates. `mixins` are
 *  the ids from `t:mixins`, attached to this instance and interleaved into its
 *  render phases (Tapestry mixins). */
export function renderComponent(
  type: string,
  container: object,
  id: string | undefined,
  bindings: Record<string, Binding>,
  informals: Record<string, string>,
  writer: MarkupWriter,
  childBody?: RenderBody,
  mixins?: string[],
): void {
  const { ctor, template } = Registry.getComponentDefinition(type);
  const instance = new ctor() as any;
  instance[BINDINGS] = bindings;
  assertRequiredParams(instance, type, id, bindings);
  instance[CONTAINER] = container;
  instance[COMPONENT_ID] = id;
  instance[INFORMALS] = informals;
  if (childBody) instance[CHILD_BODY] = childBody;
  // Register on the container so @InjectComponent can resolve this child by id.
  if (id !== undefined) {
    const parent = container as any;
    (parent[CHILDREN] ?? (parent[CHILDREN] = {}))[id] = instance;
  }
  // Attach mixins: the class's implementation mixins (@Mixin) plus the template's
  // t:mixins, de-duplicated and ordered by their before:/after: constraints. Each
  // shares the host's bindings (so its @Parameters read their declared names, and a
  // shared param name is the same value on both), and its container is the *host*
  // component (for @InjectContainer / @BindParameter).
  const where = id ? `<${type} t:id="${id}">` : `<${type}>`;
  const mixinNames = resolveMixins(instance, mixins, where);
  const mixinInstances = mixinNames.length
    ? mixinNames.map((m) => {
        const def = Registry.getComponentDefinition(m);
        const mi = new def.ctor() as any;
        mi[BINDINGS] = bindings;
        mi[CONTAINER] = instance;
        return mi;
      })
    : undefined;
  driveInstance(instance, writer, template, childBody, mixinInstances);
}
