import { registerPhase } from "./registerPhase.js";

export function BeforeRenderTemplate(target: object, key: string): void {
  registerPhase(target, "beforeRenderTemplate", key);
}
