import { DomMarkupWriter } from "./DomMarkupWriter.js";
import { driveInstance } from "./driveInstance.js";
import type { MountOptions, RenderProgram } from "./types.js";

export function mount<T extends object>(
  instance: T,
  template: RenderProgram<T>,
  options: MountOptions,
): T {
  driveInstance(instance, new DomMarkupWriter(options.mount), template as RenderProgram);
  return instance;
}
