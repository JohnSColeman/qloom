import { registerPhase } from "./registerPhase.js";

export function BeforeRenderBody(target: object, key: string): void {
  registerPhase(target, "beforeRenderBody", key);
}
